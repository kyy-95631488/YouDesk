package main

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

func (a *App) CheckYtDlp() bool {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	if _, err := os.Stat(filepath.Join(getExeDir(), "yt-dlp"+ext)); os.IsNotExist(err) {
		return false
	}
	if _, err := os.Stat(filepath.Join(getExeDir(), "ffmpeg"+ext)); os.IsNotExist(err) {
		return false
	}
	if _, err := os.Stat(filepath.Join(getExeDir(), "ffprobe"+ext)); os.IsNotExist(err) {
		return false
	}
	return true
}

func (a *App) UpdateYtDlp() string {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	cmd := exec.Command(binName, "-U")
	hideWindow(cmd)
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		return fmt.Sprintf("Error updating core engine: %v", err)
	}
	return "Updated core engine successfully"
}

func (a *App) EnsureYtDlp() string {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	} else if runtime.GOOS == "darwin" {
		ext = "_macos"
	}

	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)
	if _, err := os.Stat(binName); os.IsNotExist(err) {
		url := "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" + ext
		resp, err := http.Get(url)
		if err != nil {
			return fmt.Sprintf("Error downloading core engine: %v", err)
		}
		defer resp.Body.Close()

		out, err := os.Create(binName)
		if err != nil {
			return fmt.Sprintf("Error creating file: %v", err)
		}
		defer out.Close()

		counter := &WriteCounter{
			Total:    uint64(resp.ContentLength),
			ctx:      a.ctx,
			lastTime: time.Now(),
		}

		// Initial emit
		wailsruntime.EventsEmit(a.ctx, "download_progress", map[string]interface{}{
			"downloaded": 0,
			"total":      counter.Total,
			"percent":    0,
			"speed":      0,
		})

		_, err = io.Copy(out, io.TeeReader(resp.Body, counter))
		if err != nil {
			return fmt.Sprintf("Error saving core engine: %v", err)
		}
		if runtime.GOOS != "windows" {
			os.Chmod(binName, 0755)
		}

		// Final emit
		// Final emit
		wailsruntime.EventsEmit(a.ctx, "download_progress", map[string]interface{}{
			"downloaded": counter.Total,
			"total":      counter.Total,
			"percent":    100,
			"speed":      0,
		})
	}

	// Also ensure ffmpeg and ffprobe
	if runtime.GOOS == "windows" {
		err := a.ensureFFmpegWindows()
		if err != nil {
			return fmt.Sprintf("Error downloading media decoder: %v", err)
		}
	}

	return "Downloaded components successfully"
}

func (a *App) ensureFFmpegWindows() error {
	ext := ".exe"
	ffmpegPath := filepath.Join(getExeDir(), "ffmpeg"+ext)
	ffprobePath := filepath.Join(getExeDir(), "ffprobe"+ext)

	if _, err := os.Stat(ffmpegPath); err == nil {
		if _, err := os.Stat(ffprobePath); err == nil {
			return nil // both exist
		}
	}

	wailsruntime.EventsEmit(a.ctx, "download_progress", map[string]interface{}{
		"downloaded": 0, "total": 100, "percent": 0, "speed": 0,
	})

	url := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	tmpFile, err := os.CreateTemp("", "ffmpeg-*.zip")
	if err != nil {
		return err
	}
	defer os.Remove(tmpFile.Name())

	counter := &WriteCounter{
		Total:    uint64(resp.ContentLength),
		ctx:      a.ctx,
		lastTime: time.Now(),
	}

	_, err = io.Copy(tmpFile, io.TeeReader(resp.Body, counter))
	if err != nil {
		return err
	}
	tmpFile.Close()

	r, err := zip.OpenReader(tmpFile.Name())
	if err != nil {
		return err
	}
	defer r.Close()

	for _, f := range r.File {
		if filepath.Base(f.Name) == "ffmpeg.exe" || filepath.Base(f.Name) == "ffprobe.exe" {
			rc, err := f.Open()
			if err != nil {
				return err
			}
			outPath := filepath.Join(getExeDir(), filepath.Base(f.Name))
			outFile, err := os.Create(outPath)
			if err != nil {
				rc.Close()
				return err
			}
			io.Copy(outFile, rc)
			outFile.Close()
			rc.Close()
		}
	}

	return nil
}

