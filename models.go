package main

type VideoResult struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	Channel    string  `json:"uploader"`
	ChannelURL string  `json:"channel_url"`
	Duration   float64 `json:"duration"` // sometimes returned as float
	ViewCount  int     `json:"view_count"`
	Thumbnail  string  `json:"thumbnail"`
	WebpageURL string  `json:"url"` // in flat-playlist, it's url
}

type VideoDetails struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Channel     string   `json:"uploader"`
	ChannelID   string   `json:"channel_id"`
	ChannelURL  string   `json:"channel_url"`
	Duration    float64  `json:"duration"`
	ViewCount   int      `json:"view_count"`
	Thumbnail   string   `json:"thumbnail"`
	WebpageURL  string   `json:"webpage_url"`
	Formats     []Format `json:"formats"`
	Description string   `json:"description"`
	LikeCount   int      `json:"like_count"`
	UploadDate  string   `json:"upload_date"`
	Tags        []string `json:"tags"`
}

type Format struct {
	FormatID   string  `json:"format_id"`
	Ext        string  `json:"ext"`
	Resolution string  `json:"resolution"`
	URL        string  `json:"url"`
	Vcodec     string  `json:"vcodec"`
	Acodec     string  `json:"acodec"`
	Fps        float64 `json:"fps"`
	FormatNote string  `json:"format_note"`
	Abr        float64 `json:"abr"`
	Vbr        float64 `json:"vbr"`
}

// PlaylistResult is a single playlist entry from a channel
type PlaylistResult struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Thumbnail  string `json:"thumbnail"`
	VideoCount int    `json:"playlist_count"`
	URL        string `json:"url"`
}

type ChannelInfo struct {
	ID          string   `json:"channel_id"`
	Name        string   `json:"uploader"`
	UploaderID  string   `json:"uploader_id"`
	Description string   `json:"description"`
	Thumbnail   string   `json:"thumbnail"`
	Subscribers int      `json:"channel_follower_count"`
	ChannelURL  string   `json:"channel_url"`
	Tags        []string `json:"tags"`
	// Derived fields we populate manually
	AvatarURL string `json:"avatar_url"`
	BannerURL string `json:"banner_url"`
}
