package main

import (
	"context"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
)

type App struct {
	ctx           context.Context
	cookieBrowser string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	// Start a local HTTP server for media streaming (bypassing Wails WebView2 range request limits)
	go func() {
		http.HandleFunc("/media", func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Query().Get("path")
			if path == "" {
				w.WriteHeader(http.StatusBadRequest)
				return
			}
			path, _ = url.PathUnescape(path)
			// Enable CORS so frontend can access it
			w.Header().Set("Access-Control-Allow-Origin", "*")
			http.ServeFile(w, r, path)
		})
		http.ListenAndServe("127.0.0.1:34567", nil)
	}()
}

// SetCookieBrowser sets the browser to use for yt-dlp cookies (e.g. chrome, edge)
func (a *App) SetCookieBrowser(browser string) {
	a.cookieBrowser = browser
}

func getExeDir() string {
	ex, err := os.Executable()
	if err != nil {
		return "."
	}
	return filepath.Dir(ex)
}
