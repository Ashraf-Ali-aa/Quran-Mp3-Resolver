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
        name: "Quran Mp3",
        icon: "quran-mp3-icon.png",
        weight: 90,
        timeout: 5
    },
    init: function () {
        Tomahawk.reportCapabilities(TomahawkResolverCapability.Browsable);
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
            track: item.title,
            albumpos: item.track,
            source: "quran-mp3",
            size: (item.size || ""),
            duration: (item.duration || ""),
            bitrate: "",
            url: item.url,
            extension: "mp3",
            year: ""
        };
        return result;
    },
    /// mod 
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
                Tomahawk.log(tracks.length + " tracks returned.")
                for (var i = 0; i < tracks.length; i++) {
                    Tomahawk.log("artist =          " + tracks[i].artist);
                    Tomahawk.log("album  =          " + tracks[i].album);
                    Tomahawk.log("url    =          " + tracks[i].url);
                    if (tracks[i].artist && artist && tracks[i].artist.toLowerCase() === artist.toLowerCase() && tracks[i].album && album && tracks[i].album.toLowerCase() === album.toLowerCase()) {
                        results.push(that.parsedAudio(tracks[i]));
                    }
                }
            } else if (tracks && tracks.artist && artist && tracks.artist.toLowerCase() === artist.toLowerCase() && tracks.album && album && tracks.album.toLowerCase() === album.toLowerCase()) {
                results.push(that.parsedAudio(tracks));
            }
            return_tracks.sort(function (a, b) {
                if (a.albumpos < b.albumpos) {
                    return -1;
                } else if (a.albumpos > b.albumpos) {
                    return 1;
                } else {
                    return 0;
                }
            });
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
        //var search_url = this.baseUrl() + "artist/" + artist + "&album=" + album + "&title=" + title + "&count=1";
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
        var tracks_url = this.baseUrl() + "album/" + encodeURIComponent(album) + "/0/114/";
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