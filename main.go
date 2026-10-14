package main

import (
	"embed"
	"fmt"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

//go:embed all:frontend/dist
var assets embed.FS

type LocalFileHandler struct{}

func (h *LocalFileHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/")
	realPath, err := url.PathUnescape(path)
	if err == nil && realPath != "" {
		if fi, err := os.Stat(realPath); err == nil && !fi.IsDir() {
			http.ServeFile(w, r, realPath)
			return
		}
	}
	w.WriteHeader(http.StatusNotFound)
}

func main() {
	// Create an instance of the app structure
	app := NewApp()

	// Default to embedded assets for a true standalone single executable
	var assetServerAssets fs.FS = assets

	// Optional override: if an external "ui" folder exists right next to the executable, use it
	ex, err := os.Executable()
	if err == nil {
		uiPath := filepath.Join(filepath.Dir(ex), "ui")
		if fi, err := os.Stat(uiPath); err == nil && fi.IsDir() {
			assetServerAssets = os.DirFS(uiPath)
		}
	}

	// Create application with options
	err = wails.Run(&options.App{
		Title:  "YouTubeDESK",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets:  assetServerAssets,
			Handler: &LocalFileHandler{},
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		fmt.Println("Error:", err.Error())
	}
}
