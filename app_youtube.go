package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"
)

// SearchVideos uses yt-dlp to search for videos
func (a *App) SearchVideos(query string, limit int, offset int) ([]VideoResult, error) {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	totalToFetch := offset + limit

	args := []string{"-j", "--flat-playlist", fmt.Sprintf("ytsearch%d:%s", totalToFetch, query)}
	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		if a.cookieBrowser != "" && a.cookieBrowser != "none" {
			wailsruntime.EventsEmit(a.ctx, "dpapi_error", "Browser memblokir akses ke Cookie (Database terkunci/enkripsi). Silakan tutup browser sepenuhnya, atau gunakan Mozilla Firefox di Settings. Mengalihkan ke mode normal...")

			// Retry without cookies
			retryArgs := []string{"-j", "--flat-playlist", fmt.Sprintf("ytsearch%d:%s", totalToFetch, query)}
			retryCmd := exec.Command(binName, retryArgs...)
			hideWindow(retryCmd)

			out.Reset()
			stderr.Reset()
			retryCmd.Stdout = &out
			retryCmd.Stderr = &stderr
			err = retryCmd.Run()
			if err != nil {
				return nil, fmt.Errorf("retry failed: %v | stderr: %s", err, stderr.String())
			}
		} else {
			return nil, fmt.Errorf("failed to run yt-dlp: %v | stderr: %s", err, stderr.String())
		}
	}

	var results []VideoResult
	scanner := bufio.NewScanner(&out)
	// We might need a larger buffer for scanning if json is large
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		var res VideoResult
		if err := json.Unmarshal(scanner.Bytes(), &res); err == nil {
			// fallback for thumbnail in flat-playlist
			if res.Thumbnail == "" {
				res.Thumbnail = fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", res.ID)
			}
			results = append(results, res)
		}
	}

	if offset >= len(results) {
		return []VideoResult{}, nil
	}
	end := offset + limit
	if end > len(results) {
		end = len(results)
	}
	return results[offset:end], nil
}

// GetPopularVideos gets some popular videos
func (a *App) GetPopularVideos(limit int, offset int) ([]VideoResult, error) {
	return a.SearchVideos("trending music", limit, offset)
}

// GetChannelVideos uses yt-dlp to get a channel's videos using pagination
func (a *App) GetChannelVideos(channelUrl string, limit int, offset int) ([]VideoResult, error) {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	start := offset + 1
	end := offset + limit

	args := []string{"-j", "--flat-playlist", "--playlist-start", fmt.Sprintf("%d", start), "--playlist-end", fmt.Sprintf("%d", end), channelUrl}
	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		if a.cookieBrowser != "" && a.cookieBrowser != "none" {
			wailsruntime.EventsEmit(a.ctx, "dpapi_error", "Browser memblokir akses ke Cookie (Database terkunci/enkripsi). Silakan tutup browser sepenuhnya, atau gunakan Mozilla Firefox di Settings. Mengalihkan ke mode normal...")

			retryArgs := []string{"-j", "--flat-playlist", "--playlist-start", fmt.Sprintf("%d", start), "--playlist-end", fmt.Sprintf("%d", end), channelUrl}
			retryCmd := exec.Command(binName, retryArgs...)
			hideWindow(retryCmd)

			out.Reset()
			stderr.Reset()
			retryCmd.Stdout = &out
			retryCmd.Stderr = &stderr
			err = retryCmd.Run()
			if err != nil {
				return nil, fmt.Errorf("retry failed: %v | stderr: %s", err, stderr.String())
			}
		} else {
			return nil, fmt.Errorf("failed to run yt-dlp: %v | stderr: %s", err, stderr.String())
		}
	}

	var results []VideoResult
	scanner := bufio.NewScanner(&out)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		var res VideoResult
		if err := json.Unmarshal(scanner.Bytes(), &res); err == nil {
			if res.Thumbnail == "" {
				res.Thumbnail = fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", res.ID)
			}
			results = append(results, res)
		}
	}

	return results, nil
}

// GetVideoDetails gets full details including playable URLs
func (a *App) GetVideoDetails(videoURL string) (*VideoDetails, error) {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	args := []string{"-j", videoURL}
	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser, "--mark-watched"}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		if a.cookieBrowser != "" && a.cookieBrowser != "none" {
			wailsruntime.EventsEmit(a.ctx, "dpapi_error", "Browser memblokir akses ke Cookie (Database terkunci/enkripsi). Silakan tutup browser sepenuhnya, atau gunakan Mozilla Firefox di Settings. Mengalihkan ke mode normal...")

			// Retry without cookies
			retryArgs := []string{"-j", videoURL}
			retryCmd := exec.Command(binName, retryArgs...)
			hideWindow(retryCmd)

			out.Reset()
			stderr.Reset()
			retryCmd.Stdout = &out
			retryCmd.Stderr = &stderr
			err = retryCmd.Run()
			if err != nil {
				return nil, fmt.Errorf("retry failed: %v | stderr: %s", err, stderr.String())
			}
		} else {
			return nil, fmt.Errorf("failed to run yt-dlp: %v | stderr: %s", err, stderr.String())
		}
	}

	var details VideoDetails
	if err := json.Unmarshal(out.Bytes(), &details); err != nil {
		return nil, err
	}
	return &details, nil
}

// GetChannelPlaylists fetches all playlists from a channel's /playlists page
func (a *App) GetChannelPlaylists(channelUrl string) ([]PlaylistResult, error) {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	// Ensure we hit the /playlists tab
	baseUrl := strings.TrimRight(channelUrl, "/")
	if !strings.HasSuffix(baseUrl, "/playlists") {
		baseUrl = strings.TrimSuffix(strings.TrimSuffix(strings.TrimSuffix(
			strings.TrimSuffix(baseUrl, "/videos"),
			"/shorts"), "/live"), "/featured") + "/playlists"
	}

	args := []string{"-j", "--flat-playlist", baseUrl}
	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		// Retry without cookies
		retryArgs := []string{"-j", "--flat-playlist", baseUrl}
		retryCmd := exec.Command(binName, retryArgs...)
		hideWindow(retryCmd)
		out.Reset()
		stderr.Reset()
		retryCmd.Stdout = &out
		retryCmd.Stderr = &stderr
		err = retryCmd.Run()
		if err != nil {
			return nil, fmt.Errorf("failed to get playlists: %v | stderr: %s", err, stderr.String())
		}
	}

	var results []PlaylistResult
	scanner := bufio.NewScanner(&out)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)

	for scanner.Scan() {
		var p PlaylistResult
		if err2 := json.Unmarshal(scanner.Bytes(), &p); err2 == nil {
			if p.ID == "" {
				continue
			}
			if p.URL == "" {
				p.URL = fmt.Sprintf("https://www.youtube.com/playlist?list=%s", p.ID)
			}
			if p.Thumbnail == "" && p.ID != "" {
				// Use playlist thumbnail placeholder
				p.Thumbnail = "https://i.ytimg.com/vi/0/hqdefault.jpg"
			}
			results = append(results, p)
		}
	}

	return results, nil
}

// GetChannelInfo fetches metadata for a YouTube channel by getting the first video's metadata
func (a *App) GetChannelInfo(channelUrl string) (*ChannelInfo, error) {
	ext := ""
	if runtime.GOOS == "windows" {
		ext = ".exe"
	}
	binName := filepath.Join(getExeDir(), "yt-dlp"+ext)

	// Fetch the first 1 video from the channel to get channel metadata
	videosUrl := channelUrl
	if !strings.Contains(channelUrl, "/videos") && !strings.Contains(channelUrl, "/streams") {
		videosUrl = strings.TrimRight(channelUrl, "/") + "/videos"
	}
	args := []string{"-j", "--flat-playlist", "--playlist-items", "1", videosUrl}
	if a.cookieBrowser != "" && a.cookieBrowser != "none" {
		args = append([]string{"--cookies-from-browser", a.cookieBrowser}, args...)
	}

	cmd := exec.Command(binName, args...)
	hideWindow(cmd)

	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr
	err := cmd.Run()
	if err != nil {
		// Retry without cookies
		retryArgs := []string{"-j", "--flat-playlist", "--playlist-items", "1", videosUrl}
		retryCmd := exec.Command(binName, retryArgs...)
		hideWindow(retryCmd)
		out.Reset()
		stderr.Reset()
		retryCmd.Stdout = &out
		retryCmd.Stderr = &stderr
		err = retryCmd.Run()
		if err != nil {
			return nil, fmt.Errorf("failed to get channel info: %v | stderr: %s", err, stderr.String())
		}
	}

	// Parse the first JSONL line - this is a video entry but contains channel metadata
	type rawEntry struct {
		ChannelID        string   `json:"channel_id"`
		Uploader         string   `json:"uploader"`
		UploaderID       string   `json:"uploader_id"`
		Description      string   `json:"description"`
		Thumbnail        string   `json:"thumbnail"`
		ChannelFollowers int      `json:"channel_follower_count"`
		ChannelURL       string   `json:"channel_url"`
		Tags             []string `json:"tags"`
		// playlist-level fields
		PlaylistTitle      string `json:"playlist_title"`
		PlaylistUploader   string `json:"playlist_uploader"`
		PlaylistUploaderID string `json:"playlist_uploader_id"`
	}

	var entry rawEntry
	scanner := bufio.NewScanner(&out)
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)
	for scanner.Scan() {
		if err2 := json.Unmarshal(scanner.Bytes(), &entry); err2 == nil {
			break
		}
	}

	info := &ChannelInfo{
		ID:          entry.ChannelID,
		Name:        entry.Uploader,
		UploaderID:  entry.UploaderID,
		Description: entry.Description,
		Thumbnail:   entry.Thumbnail,
		Subscribers: entry.ChannelFollowers,
		ChannelURL:  entry.ChannelURL,
		Tags:        entry.Tags,
	}

	// If playlist-level uploader info is available, use it
	if info.Name == "" {
		info.Name = entry.PlaylistUploader
	}
	if info.UploaderID == "" {
		info.UploaderID = entry.PlaylistUploaderID
	}

	// Construct avatar and banner URLs from YouTube CDN using channel_id
	if info.ID != "" {
		info.AvatarURL = fmt.Sprintf("https://yt3.ggpht.com/channel/%s=s240-c-k-c0x00ffffff-no-rj", info.ID)
		info.BannerURL = fmt.Sprintf("https://yt3.googleusercontent.com/channel/%s=w1920-fcrop64=1,00005a57ffffa5a8-k-c0xffffffff-no-nd-rj", info.ID)
	} else if info.UploaderID != "" {
		// @handle based CDN fallback
		info.AvatarURL = fmt.Sprintf("https://unavatar.io/youtube/%s", strings.TrimPrefix(info.UploaderID, "@"))
	}

	return info, nil
}
