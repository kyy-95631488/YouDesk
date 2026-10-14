package main

import (
	"bufio"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// WriteCounter tracks the download progress and emits events to the frontend
type WriteCounter struct {
	Total      uint64
	Downloaded uint64
	ctx        context.Context
	lastTime   time.Time
	lastBytes  uint64
}

func (wc *WriteCounter) Write(p []byte) (int, error) {
	n := len(p)
	wc.Downloaded += uint64(n)

	now := time.Now()
	elapsed := now.Sub(wc.lastTime).Seconds()

	// Emit progress every 0.1 seconds to avoid flooding the frontend
	if elapsed > 0.1 {
		speed := float64(wc.Downloaded-wc.lastBytes) / elapsed // bytes per second

		percent := float64(0)
		if wc.Total > 0 {
			percent = float64(wc.Downloaded) / float64(wc.Total) * 100
		}

		wailsruntime.EventsEmit(wc.ctx, "download_progress", map[string]interface{}{
			"downloaded": wc.Downloaded,
			"total":      wc.Total,
			"percent":    percent,
			"speed":      speed,
		})

		wc.lastTime = now
		wc.lastBytes = wc.Downloaded
	}
	return n, nil
}

func cleanFileName(name string) string {
	illegal := []string{"<", ">", ":", "\"", "/", "\\", "|", "?", "*"}
	for _, char := range illegal {
		name = strings.ReplaceAll(name, char, "")
	}
	name = strings.TrimSpace(name)
	if name == "" {
		return "download"
	}
	return name
}

// DownloadMedia downloads the video or audio using yt-dlp
func (a *App) DownloadMedia(videoURL string, formatID string, isAudio bool, title string) (string, error) {
	home, _ := os.UserHomeDir()
	ext := "mp4"
	filterName := "Video Files (*.mp4)"
	if isAudio {
		ext = "mp3"
		filterName = "Audio Files (*.mp3)"
	}

	safeTitle := cleanFileName(title)

	savePath, err := wailsruntime.SaveFileDialog(a.ctx, wailsruntime.SaveDialogOptions{
		DefaultFilename:  fmt.Sprintf("%s.%s", safeTitle, ext),
		DefaultDirectory: filepath.Join(home, "Downloads"),
		Title:            "Simpan File",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: filterName, Pattern: "*." + ext},
			{DisplayName: "All Files (*.*)", Pattern: "*.*"},
		},
	})
	if err != nil || savePath == "" {
		return "Cancelled", nil
	}

	extExe := ""
	if runtime.GOOS == "windows" {
		extExe = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+extExe)

	var args []string
	if isAudio {
		args = []string{"--ffmpeg-location", getExeDir(), "--newline", "-f", formatID, "-x", "--audio-format", "mp3", "-o", savePath, videoURL}
	} else {
		// Try to get best audio combined with selected video if ffmpeg is available, otherwise just use formatID
		args = []string{"--ffmpeg-location", getExeDir(), "--newline", "-f", fmt.Sprintf("%s+bestaudio/best", formatID), "--merge-output-format", "mp4", "-o", savePath, videoURL}
	}

	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	stdout, _ := cmd.StdoutPipe()
	cmd.Stderr = cmd.Stdout
	taskID := fmt.Sprintf("%d", time.Now().UnixNano())

	// Run asynchronously and notify when done
	go func() {
		wailsruntime.EventsEmit(a.ctx, "download_status", "Memulai download...")
		err := cmd.Start()
		if err != nil {
			wailsruntime.EventsEmit(a.ctx, "download_status", fmt.Sprintf("Error: %v", err))
			return
		}

		scanner := bufio.NewScanner(stdout)
		var lastErr string
		for scanner.Scan() {
			line := scanner.Text()
			if strings.HasPrefix(line, "[download]") {
				wailsruntime.EventsEmit(a.ctx, "download_progress_update", map[string]interface{}{
					"task_id":   taskID,
					"text":      line,
					"save_path": savePath,
				})
			} else if strings.HasPrefix(strings.ToUpper(line), "ERROR:") {
				lastErr = line
			}
		}

		err = cmd.Wait()
		if err != nil {
			errMsg := err.Error()
			if lastErr != "" {
				errMsg = lastErr
			}
			wailsruntime.EventsEmit(a.ctx, "download_status", fmt.Sprintf("Error: %v", errMsg))
			wailsruntime.EventsEmit(a.ctx, "download_complete", map[string]interface{}{
				"task_id": taskID,
				"error":   errMsg,
			})
		} else {
			wailsruntime.EventsEmit(a.ctx, "download_status", "Download Selesai!")
			wailsruntime.EventsEmit(a.ctx, "download_complete", map[string]interface{}{
				"task_id":   taskID,
				"save_path": savePath,
			})
		}
	}()

	return taskID, nil
}

func (a *App) DeleteFile(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}
	return os.Remove(path)
}

func (a *App) OpenFileExternally(path string) error {
	if path == "" {
		return fmt.Errorf("path is empty")
	}
	cmd := exec.Command("cmd", "/c", "start", "", path)
	return cmd.Start()
}
