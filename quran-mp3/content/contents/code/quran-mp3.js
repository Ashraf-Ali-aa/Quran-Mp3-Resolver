/* === This file is part of Tomahawk Player - <http://tomahawk-player.org> ===
 *
 * Copyright 2011, lasonic <lasconic@gmail.com>
 * Copyright 2013, Uwe L. Korn <uwelk@xhochy.com>
 * Copyright 2015, Deen ul islam <ali@deen-ul-islam.org>
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
        name: "Quran Mp3",
        icon: "quran-mp3-icon.png",
        weight: 90,
        timeout: 5
    },
    init: function () {
        Tomahawk.reportCapabilities(TomahawkResolverCapability.Browsable || TomahawkResolverCapability.UrlLookup);
    },
    // Helper methods.
    baseUrl: function () {
        return "http://quran.deen-ul-islam.org/api/";
    },
    cleanTitle: function (title, artist) {
        var newTitle = "",
            stringArray = title.split("\n");
        title.split("\n").forEach(function (split) {
            newTitle += split.trim() + " ";
        });
        newTitle = newTitle.replace("\u2013", "").replace("  ", " ").replace("\u201c", "").replace("\u201d", "");
        if (newTitle.toLowerCase().indexOf(artist.toLowerCase() + " -") === 0) {
            newTitle = newTitle.slice(artist.length + 2).trim();
        } else if (newTitle.toLowerCase().indexOf(artist.toLowerCase() + "-") === 0) {
            newTitle = newTitle.slice(artist.length + 1).trim();
        } else if (newTitle.toLowerCase().indexOf(artist.toLowerCase()) === 0) {
            newTitle = newTitle.slice(artist.length).trim();
        }
        return newTitle;
    },
    parsedAudio: function (item) {
        var result = {
            artist: item.artist,
            album: item.album,
            albumpos: item.track_number,
            track: item.title,
            info: item.title,
            size: (item.size || ""),
            duration: (item.duration || ""),
            bitrate: "",
            source: "quran-mp3",
            url: item.url,
            extension: "mp3",
            score: 1.0,
            year: ""
        };
        return result;
    },
    /// url lookup
    canParseUrl: function (url, type) {
        switch (type) {
        case TomahawkUrlType.Album:
            return (/https?:\/\/quran.deen-ul-islam.org\/album\//).test(url);
        case TomahawkUrlType.Artist:
            return (/https?:\/\/quran.deen-ul-islam.org\/artist\//).test(url);
        case TomahawkUrlType.Playlist:
            return (/https?:\/\/quran.deen-ul-islam.org\/playlist\//).test(url)
            // case TomahawkUrlType.Track:
            // case TomahawkUrlType.Any:
        default:
            return (/https?:\/\/quran.deen-ul-islam.org\//).test(url);
        }
    },
    lookupUrl: function (url) {
        var that = this;
        var urlParts = url.split('/').filter(function (item) {
            return item.length !== 0;
        }).map(decodeURIComponent);
        if (/https?:\/\/quran.deen-ul-islam.org\/album\//.test(url)) {
            // We have to deal with an Album
            Tomahawk.addUrlResult(url, {
                type: 'album',
                name: urlParts[urlParts.length - 1],
                artist: urlParts[urlParts.length - 2]
            });
        } else if (/https?:\/\/quran.deen-ul-islam.org\/artist\//.test(url)) {
            // We have to deal with an Artist
            Tomahawk.addUrlResult(url, {
                type: 'artist',
                name: urlParts[urlParts.length - 1]
            });
        } else if (/https?:\/\/quran.deen-ul-islam.org\/playlist\//.test(url)) {
            // We have a playlist
            Tomahawk.addUrlResult(url, {
                type: 'xspf-url',
                url: url.replace('toma.hk/p/', 'toma.hk/xspf/')
            });
        } else if (/https?:\/\/quran.deen-ul-islam.org\/\?(artist=)[^&]*(&title=)/.test(url)) {
            // We search for a track
            Tomahawk.addUrlResult(url, {
                type: "track",
                title: decodeURIComponent(url.match(/(\&title=)([^&]*)/)[2]),
                artist: decodeURIComponent(url.match(/(\?artist=)([^&]*)/)[2])
            })
        } else if (/https?:\/\/quran.deen-ul-islam.org\/\?(title=)[^&]*(&artist=)/.test(url)) {
            // We search for a track
            Tomahawk.addUrlResult(url, {
                type: "track",
                title: decodeURIComponent(url.match(/(\?title=)([^&]*)/)[2]),
                artist: decodeURIComponent(url.match(/(\&artist=)([^&]*)/)[2])
            })
        } else {
            // We most likely have a track
            var query = url.replace("http://quran.deen-ul-islam.org", "http://toma.hk/api.php?id=");
            Tomahawk.asyncRequest(query, function (xhr) {
                var res = JSON.parse(xhr.responseText);
                if (res.artist.length > 0 && res.title.length > 0) {
                    Tomahawk.addUrlResult(url, {
                        type: "track",
                        title: res.title,
                        artist: res.artist
                    });
                } else {
                    Tomahawk.addUrlResult(url, {});
                }
            });
        }
    },
    /// Query 
    SearchQuery: function (qid, search_url) {
        var results = [];
        var that = this;
        var empty = {
            qid: qid,
            results: []
        };
        Tomahawk.asyncRequest(search_url, function (xhr) {
            response = JSON.parse(xhr.responseText);
            searchResults = response.audios;
            if (searchResults) {
                Tomahawk.log(searchResults.length + " results returned.");
                for (var i = 0; i < searchResults.length; i++) {
                    results.push(that.parsedAudio(searchResults[i]));
                }
                var return_audios = {
                    qid: qid,
                    results: results
                };
                Tomahawk.addTrackResults(return_audios);
            }
        });
    },
    ArtistsQuery: function (qid, artists_url) {
        var results = [];
        Tomahawk.asyncRequest(artists_url, function (xhr) {
            var response = JSON.parse(xhr.responseText);
            Tomahawk.log("Quran Mp3 artists query:" + artists_url);
            Tomahawk.log("Quran Mp3 artists response:" + xhr.responseText);
            if ( !! response.artists) {
                var artists = response.artists;
                Tomahawk.log("artists response:" + artists);
                for (var i = 0; i < artists.length; i++) {
                    if (artists[i] instanceof Array) {
                        for (var j = 0; j < artists[i].length; j++) {
                            results.push(artists[i].name)
                        }
                    } else {
                        results.push(artists[i].name)
                    }
                }
            }
            var return_artists = {
                qid: qid,
                artists: results
            };
            Tomahawk.log("Quran Mp3 artists about to return: " + JSON.stringify(return_artists));
            Tomahawk.addArtistResults(return_artists);
        });
    },
    AlbumsQuery: function (qid, search_url, artist) {
        var results = [];
        Tomahawk.asyncRequest(search_url, function (xhr) {
            var response = JSON.parse(xhr.responseText);
            Tomahawk.log("Quran Mp3 albums query:" + search_url);
            Tomahawk.log("Quran Mp3 albums response:" + xhr.responseText);
            var albums = response.albums;
            if (albums instanceof Array) {
                Tomahawk.log(albums.length + " albums returned.")
                for (var i = 0; i < albums.length; i++) {
                    if (albums[i].artist.toLowerCase() === artist.toLowerCase()) //search2 does partial matches
                    {
                        results.push(albums[i].name)
                    }
                }
            } else {
                if (albums.artist.toLowerCase() === artist.toLowerCase()) {
                    results.push(albums.name);
                }
            }
            var return_albums = {
                qid: qid,
                artist: artist,
                albums: results
            };
            Tomahawk.log("Quran Mp3 albums about to return: " + JSON.stringify(return_albums));
            Tomahawk.addAlbumResults(return_albums);
        });
    },
    TracksQuery: function (qid, search_url, artist, album) {
        var results = [];
        var that = this;
        Tomahawk.asyncRequest(search_url, function (xhr) {
            var response = JSON.parse(xhr.responseText);
            Tomahawk.log("Quran Mp3 tracks query:" + search_url);
            Tomahawk.log("Quran Mp3 tracks response:" + xhr.responseText);
            var tracks = response.audios;
            if (tracks instanceof Array) {
                Tomahawk.log(tracks.length + " tracks returned.");
                for (var i = 0; i < tracks.length; i++) {
                    results.push(that.parsedAudio(tracks[i]));
                }
            } else {
                results.push(that.parsedAudio(tracks));
            }
            var return_tracks = {
                qid: qid,
                artist: artist,
                album: album,
                results: results
            };
            Tomahawk.log("Quran Mp3 tracks about to return: " + JSON.stringify(return_tracks));
            Tomahawk.addAlbumTrackResults(return_tracks);
        });
    },
    // Script Collection Support
    resolve: function (qid, artist, album, title) {
        var search_url = this.baseUrl() + "search/" + encodeURIComponent(title) + "/0/114/";
        //var search_url = this.baseUrl() + "search-filter/" + encodeURIComponent(artist) + "/" + encodeURIComponent(title) + "/" + encodeURIComponent(title)"/0/114/";
        //var search_url = this.baseUrl() + "&artist=" + artist + "&album=" + album + "&title=" + title + "&count=1";
        this.SearchQuery(qid, search_url);
    },
    search: function (qid, searchString) {
        search_url = this.baseUrl() + "search/" + encodeURIComponent(searchString) + "/0/200/";
        this.SearchQuery(qid, search_url);
    },
    artists: function (qid) {
        var artists_url = this.baseUrl() + "artists/all";
        this.ArtistsQuery(qid, artists_url);
    },
    albums: function (qid, artist) {
        var albums_url = this.baseUrl() + "albums/all";
        this.AlbumsQuery(qid, albums_url, artist);
    },
    tracks: function (qid, artist, album) {
        var tracks_url = this.baseUrl() + "album/" + encodeURIComponent(album) + "/0/300/";
        this.TracksQuery(qid, tracks_url, artist, album);
    },
    collection: function () {
        return {
            prettyname: "Quran Mp3",
            description: "The Holy Quran",
            iconfile: "../images/icon.png"
        };
    }
});
Tomahawk.resolver.instance = QuranMp3Resolver;