export namespace main {
	
	export class ChannelInfo {
	    channel_id: string;
	    uploader: string;
	    uploader_id: string;
	    description: string;
	    thumbnail: string;
	    channel_follower_count: number;
	    channel_url: string;
	    tags: string[];
	    avatar_url: string;
	    banner_url: string;
	
	    static createFrom(source: any = {}) {
	        return new ChannelInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.channel_id = source["channel_id"];
	        this.uploader = source["uploader"];
	        this.uploader_id = source["uploader_id"];
	        this.description = source["description"];
	        this.thumbnail = source["thumbnail"];
	        this.channel_follower_count = source["channel_follower_count"];
	        this.channel_url = source["channel_url"];
	        this.tags = source["tags"];
	        this.avatar_url = source["avatar_url"];
	        this.banner_url = source["banner_url"];
	    }
	}
	export class Format {
	    format_id: string;
	    ext: string;
	    resolution: string;
	    url: string;
	    vcodec: string;
	    acodec: string;
	    fps: number;
	    format_note: string;
	    abr: number;
	    vbr: number;
	
	    static createFrom(source: any = {}) {
	        return new Format(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.format_id = source["format_id"];
	        this.ext = source["ext"];
	        this.resolution = source["resolution"];
	        this.url = source["url"];
	        this.vcodec = source["vcodec"];
	        this.acodec = source["acodec"];
	        this.fps = source["fps"];
	        this.format_note = source["format_note"];
	        this.abr = source["abr"];
	        this.vbr = source["vbr"];
	    }
	}
	export class PlaylistResult {
	    id: string;
	    title: string;
	    thumbnail: string;
	    playlist_count: number;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new PlaylistResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.thumbnail = source["thumbnail"];
	        this.playlist_count = source["playlist_count"];
	        this.url = source["url"];
	    }
	}
	export class VideoDetails {
	    id: string;
	    title: string;
	    uploader: string;
	    channel_id: string;
	    channel_url: string;
	    duration: number;
	    view_count: number;
	    thumbnail: string;
	    webpage_url: string;
	    formats: Format[];
	    description: string;
	    like_count: number;
	    upload_date: string;
	    tags: string[];
	
	    static createFrom(source: any = {}) {
	        return new VideoDetails(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.uploader = source["uploader"];
	        this.channel_id = source["channel_id"];
	        this.channel_url = source["channel_url"];
	        this.duration = source["duration"];
	        this.view_count = source["view_count"];
	        this.thumbnail = source["thumbnail"];
	        this.webpage_url = source["webpage_url"];
	        this.formats = this.convertValues(source["formats"], Format);
	        this.description = source["description"];
	        this.like_count = source["like_count"];
	        this.upload_date = source["upload_date"];
	        this.tags = source["tags"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class VideoResult {
	    id: string;
	    title: string;
	    uploader: string;
	    channel_url: string;
	    duration: number;
	    view_count: number;
	    thumbnail: string;
	    url: string;
	
	    static createFrom(source: any = {}) {
	        return new VideoResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.title = source["title"];
	        this.uploader = source["uploader"];
	        this.channel_url = source["channel_url"];
	        this.duration = source["duration"];
	        this.view_count = source["view_count"];
	        this.thumbnail = source["thumbnail"];
	        this.url = source["url"];
	    }
	}

}

