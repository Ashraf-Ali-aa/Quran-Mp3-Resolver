/* === This file is part of Tomahawk Player - <http://tomahawk-player.org> ===
 *
 * Copyright 2011, lasonic <lasconic@gmail.com>
 * Copyright 2013, Uwe L. Korn <uwelk@xhochy.com>
 * Copyright 2014, Deen ul islam <ali@deen-ul-islam.org>
 *
 * Tomahawk is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Tomahawk is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Tomahawk. If not, see <http://www.gnu.org/licenses/>.
 */
var QuranMp3Resolver = Tomahawk.extend(TomahawkResolver, {
    settings: {
        name: 'Quran.Mp3',
        icon: 'quran-mp3-icon.png',
        weight: 30,
        timeout: 5
    },
    
    baseUrl: function () {
            return 'http://quran.deen-ul-islam.org/api';
    },
    
    init: function() {
        Tomahawk.reportCapabilities(TomahawkResolverCapability.UrlLookup);
    },
    cleanTitle: function(title, artist) {
        var newTitle = "",
            stringArray = title.split("\n");
        title.split("\n").forEach(function(split) {
            newTitle += split.trim() + " ";
        });
        newTitle = newTitle.replace("\u2013", "").replace("  ", " ").replace("\u201c", "").replace("\u201d", "");
        if (newTitle.toLowerCase().indexOf(artist.toLowerCase() + " -") === 0) {
            newTitle = newTitle.slice(artist.length + 2).trim();
        } else if (newTitle.toLowerCase().indexOf(artist.toLowerCase() + "-") === 0) {
            newTitle = newTitle.slice(artist.length + 1).trim();
        } else if (newTitle.toLowerCase().indexOf(artist.toLowerCase()) === 0) {
            // FIXME: This might break results where the artist name is a substring of the audio title.
            newTitle = newTitle.slice(artist.length).trim();
        }
        return newTitle;
    },
    resolve: function(qid, artist, album, title) {
        var that = this,
            // Build search query for QuranMp3
            url = "http://quran.deen-ul-islam.org/api/search/" + encodeURIComponent(title) + "/0/114/";
        // send request and parse it into javascript
        Tomahawk.asyncRequest(url, function(xhr) {
            // parse json
            var response = JSON.parse(xhr.responseText),
                results = [];
            // check the response
            if (response.results > 0) {
                response.audios.forEach(function(audio) {
                    if (typeof(audio.url) == 'undefined' || audio.url === null) {
                        return;
                    }
                    if (audio.artist === null || audio.title === null) {
                        // This track misses relevant information, so we are going to ignore it.
                        return;
                    }
                    var result  = {},
                        dTitle  = that.cleanTitle(audio.title, audio.artist),
                        dArtist = audio.artist,
                        dAlbum  = "";
                    if (audio.album !== null) {
                        dAlbum  = audio.album;
                    }
                    if (typeof(audio.sources) != 'undefined' && audio.sources !== null && audio.sources.length > 0) {
                        result.linkUrl = audio.sources[0];
                    }
                    if ((dTitle.toLowerCase().indexOf(title.toLowerCase()) !== -1 && dArtist.toLowerCase().indexOf(artist.toLowerCase()) !== -1) || (artist === "" && album === "")) {
                        result.artist    = ((dArtist !== "") ? dArtist : artist);
                        result.album     = ((dAlbum  !== "") ? dAlbum : album);
                        result.track     = ((dTitle  !== "") ? dTitle : title);
                        result.source    = that.settings.name;
                        result.url       = audio.url;
                        result.extension = "mp3";
                        result.score     = 1.00;
                        result.albumpos  = audio.track_number;
                        result.discnumber= "";
                        
                        results.push(result);
                    }
                });
            }
            Tomahawk.addTrackResults({
                qid: qid,
                results: results
            });
        });
    },
    canParseUrl: function(url, type) {
        switch (type) {
        case TomahawkUrlType.Album:
            return '/https?:\/\/quran.deen-ul-islam.org\/album\//'.test(url);
        case TomahawkUrlType.Artist:
            return '/https?:\/\/quran.deen-ul-islam.org\/artist\//'.test(url);
        case TomahawkUrlType.Track:
            return '/https?:\/\/quran.deen-ul-islam.org\/audio\//'.test(url);
        case TomahawkUrlType.Playlist:
            return '/https?:\/\/quran.deen-ul-islam.org\/playlist\//'.test(url);
            // case TomahawkUrlType.Playlist:
            // case TomahawkUrlType.Any:
        default:
            return '/https?:\/\/quran.deen-ul-islam.org\//'.test(url);
        }
    },
    track2Result: function(item) {
        var result = {
              type: "track",
             title: item.title,
            artist: item.artist,
             album: item.album
        };
        return result;
    },
    lookupUrl: function(url) {
        var urlParts = url.split('/').filter(function(item) {
            return item !== "";
        });
        var query = "http://quran.deen-ul-islam.org/api";
        var that = this;
        if (urlParts.length === 3) {
            // Url matches a user, e.g. https://QuranMp3/xhochy
            query += "/user/" + urlParts[2] + "/trending";
            query += "?client_id=tomahawk";
        } else if (/\/explore\/site-of-the-day/.test(url)) {
            // Site of the day
            query += "/sotd?results=1";
        } else if (urlParts[2] == 'explore' && urlParts[3] == 'album-of-the-week') {
            query += '/week/';
        } else if (urlParts[2] == 'explore' && urlParts[3] == 'mixtape-of-the-month') {
            query += '/motm?results=1';
        } else if (/\/album\//.test(url)) {
            query += "/album/" + urlParts[3];
            query += "/0/114/";
        } else if (/\/audio\//.test(url)) {
            // Just one simple audio
            query += "/audio/" + urlParts[3];
        } else if (/\/playlist\//.test(url)) {
            query += "/playlist/" + urlParts[3];
            query += "/0/114/";
        } else if (/https?:\/\/quran.deen-ul-islam.org\/site\//.test(url)) {
            query += url.replace(/https?:\/\/quran.deen-ul-islam.org/, '');
            query += "?client_id=tomahawk";
        } else if (urlParts[2] == "search") {
            query += "/search/" + urlParts[3];
            query += "/0/50/";
        } else {
            query += url.replace(/https?:\/\/quran.deen-ul-islam.org/, '');
            query += "?client_id=tomahawk";
        }
        Tomahawk.asyncRequest(query, function(xhr) {
            var res = JSON.parse(xhr.responseText);
            if (res.hasOwnProperty("audio")) {
                // One single audio
                return that.track2Result(res.audio);
            } else if (res.hasOwnProperty("album") && res.album.hasOwnProperty("audios")) {
                // Album
                var guid;
                if (typeof CryptoJS !== "undefined" && typeof CryptoJS.SHA256 == "function") {
                    guid = CryptoJS.SHA256(query).toString(CryptoJS.enc.Hex);
                } else {
                    guid = Tomahawk.sha256(query);
                }
                var result = {
                       type: "playlist",
                      title: res.album.title,
                       guid: 'quran-mp3-site-' + guid,
                       info: "QuranMp3 parse of : " + res.album.url,
                    creator: "quran-mp3",
                        url: url,
                     tracks: []
                };
                res.site.audios.forEach(function(item) {
                    result.tracks.push(that.track2Result(item));
                });
                Tomahawk.addUrlResult(url, result);
            } else if (res.hasOwnProperty("audios")) {
                // A list of audios
                var guid;
                if (typeof CryptoJS !== "undefined" && typeof CryptoJS.SHA256 == "function") {
                    guid = CryptoJS.SHA256(query).toString(CryptoJS.enc.Hex);
                } else {
                    guid = Tomahawk.sha256(query);
                }
                var result = {
                       type: "playlist",
                      title: "QuranMp3" + url.replace(/https?:\/\/quran.deen-ul-islam.org/, ''),
                       guid: 'quran-mp3-playlist-' + guid,
                       info: "A playlist imported from QuranMp3: " + url,
                    creator: "quran-mp3",
                        url: url,
                     tracks: []
                };
                res.audios.forEach(function(item) {
                    result.tracks.push(that.track2Result(item));
                });
                Tomahawk.addUrlResult(url, result);
            } else {
                Tomahawk.log("Could not parse QuranMp3 URL: " + url);
                Tomahawk.addUrlResult(url, {});
            }
        });
    },
    
    search: function(qid, searchString) {
        this.settings.strictMatch = false;
        this.resolve(qid, "", "", searchString);
    },
    
    // Script Collection Support

    artists: function (qid) {
        var url = this.baseUrl() + '/artists/';
        Tomahawk.asyncRequest(url, function(xhr) {
            var response = JSON.parse(xhr.responseText);
            Tomahawk.addArtistResults({
                qid: qid,
                artists: response.name
            });
        });
    },

    albums: function (qid, artist) {
        var url = this.baseUrl() + '/artist/albums/' + encodeURIComponent(artist);
        Tomahawk.asyncRequest(url, function(xhr) {
            var response = JSON.parse(xhr.responseText),
            results = [];
            response.results.forEach(function (item) {
                results.push(item.albums);
            });
            Tomahawk.addAlbumResults({
                qid: qid,
                artist: artist,
                albums: results
            });
        });
    },

    tracks: function (qid, artist, album) {
        var url = this.baseUrl() + 'album/' + encodeURIComponent(artist) + '/0/114/';
        var baseUrl = this.baseUrl();
        Tomahawk.asyncRequest(url, function(xhr) {
            var response = JSON.parse(xhr.responseText),
            searchResults = [];
            response.results.forEach(function (item) {
                searchResults.push({
                    artist: item.artist,
                    album: item.album,
                    track: item.title,
                    albumpos: item.track_number,
                    source: "quran-mp3",
                    url: item.url,
                    duration: (item.duration || 0),
                    size: (item.size || 0),
                    score: 1.0,
                    extension: "mp3"
                });
            });
            searchResults.sort(function (a, b) {
                if (a.albumpos < b.albumpos) {
                    return -1;
                } else if (a.albumpos > b.albumpos) {
                    return 1;
                } else {
                    return 0;
                }
            });
            Tomahawk.addAlbumTrackResults({
                qid: qid,
                artist: artist,
                album: album,
                results: searchResults
            });
        });
    },
    
    collection: function () {
        return {
            prettyname: "Quran Mp3",
            description: "Quran",
            iconfile: '../images/icon.png'
        };
    }
});
Tomahawk.resolver.instance = QuranMp3Resolver;