// #4 The Egyptian turn: nine genre groups built from Spotify's artist genres.
// An artist's plays split equally across their genres (generic "hip hop"/"rap" count only when they
// have nothing more specific), so each year adds up to 100%. Order matters: a genre goes to the
// first group whose pattern matches. See docs/history-stats.md (#4).

export const GENRE_GROUPS = [
  { key: 'egypt-rap', label: 'Egyptian rap', match: /arabic hip hop|egyptian hip hop|mahraganat|arabic trap|arabic drill/ },
  { key: 'arabic-pop', label: 'Arabic pop', match: /egypt|arab|khaleeji|shaabi|ra[iï]|moroccan|gnawa|lebanese|levant|libyan|sholawat|tarab/ },
  { key: 'afro', label: 'Afrobeats', match: /afro(?!swing)|^alt[eé]$|azonto|highlife|amapiano|singeli|naija|nigerian|ghana/ },
  { key: 'uk-rap', label: 'UK rap', match: /grime|uk drill|uk hip hop|afroswing|uk r&b/ },
  { key: 'underground', label: 'Underground', match: /jazz rap|boom bap|alternative hip hop|experimental hip hop|underground hip hop|abstract|plunderphonics/ },
  { key: 'west-east', label: 'West & East', match: /old school|west coast|east coast|g-funk|gangster|hardcore hip hop/ },
  { key: 'rnb', label: 'R&B & soul', match: /r&b|soul|motown|quiet storm|(?<!g-)funk/ },
  { key: 'us-rap', label: 'US rap', match: /^rap$|trap|southern|melodic rap|emo rap|rage|drill|crunk|hyphy|cloud rap|^hip hop$/ },
  { key: 'other', label: 'Other', match: /./ },
];

const GENERIC = new Set(['hip hop', 'rap']);

// Spotify-style genres for artists Spotify gives none (2026: about 40% of plays), by artist id
export const GENRES_BY_ARTIST = {
  "4LLpKhyESsyAXpc4laK94U": ["rap", "alternative hip hop"], // Mac Miller
  "6aaMZ3fcfLv4tEbmY7bjRM": ["jazz rap", "southern hip hop"], // Isaiah Rashad
  "12Zk1DFhCbHY6v3xep2ZjI": ["rap", "alternative r&b"], // 070 Shake
  "0fA0VVWsXO9YnASrzqfmYu": ["rap", "alternative hip hop"], // Kid Cudi
  "68kEuyFKyqrdQQLLsmiatm": ["west coast hip hop", "alternative hip hop"], // Vince Staples
  "3jK9MiCrA42lLAdMGUZpwa": ["neo soul", "r&b"], // Anderson .Paak
  "5SXuuuRpukkTvsLuUknva1": ["rap", "west coast hip hop"], // Baby Keem
  "4V8LLVI7PbaPR0K2TGSxFF": ["rap", "alternative hip hop"], // Tyler, The Creator
  "6eXZu6O7nAUA5z6vLV8NKI": ["uk hip hop", "grime"], // Little Simz
  "0ONHkAv9pCAFxb0zJwDNTy": ["rap", "east coast hip hop"], // Pusha T
  "6PEMFpe3PTOksdV4ZXUpbE": ["neo soul", "alternative r&b"], // NxWorries
  "2h93pZq0e7k5yf4dywlkpM": ["alternative r&b", "r&b"], // Frank Ocean
  "73sIBHcqh3Z3NyqHKZ7FOL": ["rap", "alternative r&b"], // Childish Gambino
  "4IVAbR2w4JJNJDDRFP3E83": ["r&b", "alternative r&b"], // 6LACK
  "7Hjbimq43OgxaBRpFXic4x": ["jazz rap", "alternative hip hop"], // Saba
  "6U3ybJ9UHNKEdsH7ktGBZ7": ["rap", "southern hip hop"], // JID
  "3WvsyFdCcS1E1ITmtYXGyG": ["jazz rap", "boom bap"], // Abstract Mindstate
  "2hPgGN4uhvXAxiXQBIXOmE": ["rap", "experimental hip hop"], // KIDS SEE GHOSTS
  "1Xyo4u8uXC1ZmMpatF05PJ": ["r&b", "dark r&b"], // The Weeknd
  "1iNqsUDUraNWrj00bqssQG": ["rap", "southern hip hop"], // Dreamville
  "2dBj3prW7gP9bCCOIQeDUf": ["alternative hip hop", "experimental hip hop"], // Danger Mouse
  "2J257euzcjnDLipsyJH3F2": ["rap", "east coast hip hop"], // Clipse
  "3ycxRkcZ67ALN3GQJ57Vig": ["neo soul", "jazz funk"], // Masego
  "7t3VJCyz87PJLqHM3mOt3I": ["egyptian pop", "egyptian shaabi"], // Al Massrieen
  "1ybINI1qPiFbwDXamRtwxD": ["alternative hip hop", "neo soul"], // Smino
  "0cLrgpG3pW4MX4nD8h6qCc": ["retro soul", "jazz funk"], // El Michels Affair
  "5IcR3N7QB1j6KBL8eImZ8m": ["west coast hip hop", "rap"], // ScHoolboy Q
  "70gP6Ry4Uo0Yx6uzPIdaiJ": ["rap", "alternative hip hop"], // Bas
  "0xOeVMOz2fVg5BJY3N6akT": ["rap", "alternative r&b"], // Jaden
  "5MbNzCW3qokGyoo9giHA3V": ["alternative hip hop", "southern hip hop"], // EARTHGANG
  "57vWImR43h4CaDao012Ofp": ["alternative r&b", "indie soul"], // Steve Lacy
  "0WjtdWS6su0f3jrW9aqEHl": ["alternative r&b"], // Berhana
  "1U1el3k54VvEUzo3ybLPlM": ["alternative r&b", "neo soul"], // Kali Uchis
  "6fxyWrfmjcbj5d12gXeiNV": ["rap", "southern hip hop"], // Denzel Curry
  "17Zu03OgBVxgLxWmRUyNOJ": ["lo-fi beats", "jazz beats"], // Knxwledge
  "4HzKw8XcD0piJmDrrPRCYk": ["alternative r&b", "r&b"], // Majid Jordan
  "1URnnhqYAYcrqrcwql10ft": ["trap", "southern hip hop"], // 21 Savage
  "4frXpPxQQZwbCu3eTGnZEw": ["jazz funk", "neo soul"], // Thundercat
  "1rHOtdmGNr5vcYNw5v7QGC": ["rap"], // Kenny Beats
  "1Nd1g8fezKoJ6DGauWbZIm": ["east coast hip hop", "boom bap"], // Beast Coast
  "3Gm5F95VdRxW3mqCn8RPBJ": ["rap", "melodic rap"], // Aminé
  "0z4gvV4rjIZ9wHck67ucSV": ["r&b"], // Akon
  "2TLYSzGyVYkxAgYSCqUnQj": ["uk hip hop", "neo soul"], // Jay Prince
  "062tCT8GVioC9EMiI9jeOV": ["neo soul", "alternative hip hop"], // BLK ODYSSY
  "20wkVLutqVOYrc0kxFs7rA": ["alternative r&b", "neo soul"], // Daniel Caesar
  "0g9vAlRPK9Gt3FKCekk4TW": ["west coast hip hop", "alternative hip hop"], // Ab-Soul
  "1Bl6wpkWCQ4KVgnASpvzzA": ["alternative hip hop", "rap"], // BROCKHAMPTON
  "6vHBuUxrcpn1do5UaEJ7g6": ["alternative hip hop", "jazz rap"], // Domo Genesis
  "3VwKSHAfgzV1DOHV0aANCI": ["lo-fi beats", "future bass"], // TOKiMONSTA
  "4ULO7IGI3M2bo0Ap7B9h8a": ["r&b"], // Teyana Taylor
  "5aMIbwZQvP2MHPMVC5zCGj": ["alternative r&b"], // ODIE
  "53KwLdlmrlCelAZMaLVZqU": ["alternative r&b", "art pop"], // James Blake
  "29fUSOyH1ufr9HZbErHpc4": ["underground hip hop", "rage rap"], // 454
  "0du5cEVh5yTK9QJze8zA0C": ["r&b", "funk"], // Bruno Mars
  "6gU7qtF5B31WwdgkNwF1XK": ["jazz beats", "nu jazz"], // DJ Harrison
  "4596e2d3KmYzAeVenjCxfj": ["neo soul", "jazz funk"], // Free Nationals
  "6qgnBH6iDM91ipVXv28OMu": ["lo-fi house", "alternative r&b"], // KAYTRANADA
  "01QTIT5P1pFP3QnnFSdsJf": ["alternative hip hop", "rap"], // Lupe Fiasco
  "28ExwzUQsvgJooOI0X1mr3": ["west coast hip hop", "gangster rap"], // Jay Rock
  "1anyVhU62p31KFi8MEzkbf": ["rap", "alternative hip hop"], // Chance the Rapper
  "5wPoxI5si3eJsYYwyXV4Wi": ["alternative hip hop", "funk"], // N.E.R.D
  "00Kj91nF1l4o35fAtfDAjW": ["tarab", "egyptian pop"], // Najat Al Saghira
  "1grN0519h2zYqpRtYbDZAl": ["west coast hip hop", "rap"], // Larry June
  "1ck2Isye239BEWAEocqmTT": ["lebanese pop", "tarab"], // Zaki Nassif
  "6e7BQ0gM6o8ecMXRZkXxlZ": ["jazz beats", "jazz rap"], // Karriem Riggins
  "4xPQFgDA5M2xa0ZGo5iIsv": ["rap"], // ¥$
  "15lOM8PWY9pXQoURZwSZlK": ["alternative hip hop", "jazz rap"], // Shad
  "1uRxRKC7d9zwYGSRflTKDR": ["neo soul", "retro soul"], // SAULT
  "52lsD82iOqGtyfEMqWgk4f": ["tarab"], // Umm Kulthum
  "5XenQ7XfcvQdfIbpLEFaKQ": ["rap", "alternative r&b"], // GoldLink
  "4Gso3d4CscCijv0lmajZWs": ["melodic rap", "trap"], // Don Toliver
  "1uf6plWcu7QbKiASVlTUPa": ["alternative r&b", "uk r&b"], // Wesley Joseph
  "7fw0E8WHdG3r9SuPBcGmWk": ["alternative hip hop", "jazz rap"], // Sampa the Great
  "5oFkj1qSlyBUmV5d6Edgtq": ["west coast hip hop", "rap"], // Cozz
  "2FwDTncULUnmANIh7qKa5z": ["nu jazz", "lo-fi house"], // FKJ
  "41DGOfz7IFMVvf9wKAzeZS": ["rap", "alternative hip hop"], // Jalen Santoy
  "7mDU6nMUJnOSY2Hkjz5oqM": ["r&b", "alternative r&b"], // Roy Woods
  "6NL31G53xThQXkFs7lDpL5": ["jazz rap", "boom bap"], // Rapsody
  "6tPa6NxEdaNHWKupImT46F": ["libyan folk", "arabic folk"], // Ibrahim Hesnawi
  "4GcpBLY8g8NrmimWbssM26": ["jazz beats", "lo-fi beats"], // Mndsgn
  "6tpaMMCs8X6o8j9H5OmWmT": ["neo soul", "alternative r&b"], // Yaya Bey
  "2rwALQ1SXdfUWPUd6WOfYS": ["lo-fi hip hop"], // Aaron May
  "0huGjMyP507tBCARyzSkrv": ["rap", "alternative hip hop"], // Cordae
  "0tPjSrb43a58uznKru1k2P": ["east coast hip hop", "rap"], // A$AP Twelvyy
  "1GwinA1uq3G9r8PNK9MoRy": ["tarab", "levantine folk"], // Georgette Sayegh
  "0dwFxqYkvZLSA6U6XfQcDV": ["lebanese pop", "tarab"], // Fairuz
  "3kf0gOpxWtkyeMNJVDQPtd": ["east coast hip hop", "boom bap"], // Smoke DZA
  "0H39MdGGX6dbnnQPt6NQkZ": ["r&b", "melodic rap"], // SAINt JHN
  "0iEtIxbK0KxaSlF7G42ZOp": ["trap", "rap"], // Metro Boomin
  "2RdwBSPQiwcmiDo9kixcl8": ["r&b", "funk"], // Pharrell Williams
  "1dqGS5sT6PE2wEvP1gROZC": ["east coast hip hop", "underground hip hop"], // Flatbush Zombies
  "3myefQO8upDe4aNxjTFddr": ["tarab", "arabic pop"], // Warda
  "1FcYCSOydUCgoauspPwypS": ["lebanese pop", "arabic pop"], // Majida El Roumi
  "5oifjQw72WO7Jut07fVWMy": ["rap", "lo-fi house"], // KAYTRAMINÉ
  "7yO4IdJjCEPz7YgZMe25iS": ["east coast hip hop", "rap"], // A$AP Mob
  "1F9XUalYzU3FBioU2EBJro": ["boom bap", "jazz beats"], // Kankick
  "2mQLwfvZtvtTbipKn3xHmK": ["east coast hip hop", "alternative hip hop"], // Erick the Architect
  "0WOxhx4hikIsyF3CRPLC8W": ["trap"], // Famous Dex
  "7A8S43ryYdbWpJKeHRZRcq": ["trap", "rap"], // JACKBOYS
  "5pKCCKE2ajJHZ9KAiaK11H": ["r&b", "art pop"], // Rihanna
  "0jIWKlfmD4Ew7HeVVrq03g": ["arabic pop"], // Elyanna
  "3K2Srho6NCF3o9MswGR76H": ["indie soul", "art pop"], // Bakar
  "13Kd75NSHSp9lB4CaqPMOV": ["lo-fi beats", "future bass"], // Ta-ku
  "5dhObqVu8dAvxklbfr3SJx": ["jazz rap", "boom bap"], // Champion Sound
  "5cj0lLjcoR7YOSnhnX0Po5": ["rap", "r&b"], // Doja Cat
  "53S3boqktbqiB1JfHzsu1f": ["east coast hip hop", "gangster rap"], // Armani Caesar
  "5XDJlfdfbGNJrOJJNxTcdq": ["rap", "melodic rap"], // Phora
  "6aiFCgyKNwF9Rv5TOxnE8E": ["rap", "alternative hip hop"], // IDK
  "6XpXnnKHIhCOUbOLOJGe6o": ["west coast hip hop", "rap"], // REASON
  "4p75GTNEXwsAAkpweMVtKo": ["lo-fi beats", "neo soul"], // monte booker
  "07d5etnpjriczFBB8pxmRe": ["neo soul", "r&b"], // BJ The Chicago Kid
  "16L1SS4OancaZUTu3qWqHb": ["jazz rap", "boom bap"], // Jay Dee
  "0M1ImWN3uInxUCZVIE9uxa": ["art pop", "alternative r&b"], // Devonté Hynes
  "7MigDh04CCntQbsBvugEmb": ["boom bap", "east coast hip hop"], // Marlon Craft
  "7izarc0fRIPbdZ8cVyChRf": ["alternative hip hop", "southern hip hop"], // Spillage Village
  "6RedK3o51NbUJuJxXlT4kj": ["alternative hip hop"], // 88-Keys
  "0fGcIStdT1OpFFhOC7Wp36": ["alternative r&b", "rap"], // Teezo Touchdown
  "2AfU5LYBVCiCtuCCfM7uVX": ["jazz rap", "lo-fi hip hop"], // Kota the Friend
  "0b3fYxnG6tlR0zLtBJd8DF": ["alternative hip hop", "jazz rap"], // DANGERDOOM
  "332mFY6yBda91AsIOSKirG": ["alternative r&b", "neo soul"], // Planet Giza
  "5xpkLC1MxiPRiIJUDEzuVm": ["alternative hip hop", "rap"], // Odd Future
  "6icQOAFXDZKsumw3YXyusw": ["rap", "trap"], // Lil Yachty
  "00FQb4jTyendYWaN8pK0wa": ["art pop", "dream pop"], // Lana Del Rey
  "5f7VJjfbwm532GiveGC0ZK": ["trap", "southern hip hop"], // Lil Baby
  "6zVFRTB0Y1whWyH7ZNmywf": ["neo-psychedelic"], // Tash Sultana
  "6xS5PpBWaVYraexEkEjjXv": ["southern hip hop", "trap"], // Maxo Kream
  "0FOWNUFHPnMy0vOw1siGqi": ["rap", "melodic rap"], // Belly
  "6IW026WCYU8L1WF79dfwss": ["tarab", "egyptian pop"], // Abdel Halim Hafez
  "5727wMPGcNsG22DBboWpX6": ["lo-fi beats"], // Nascent
  "5y8tKLUfMvliMe8IKamR32": ["bedroom pop"], // d4vd
  "0jsnWH4QCKcAMpR7vEhh9u": ["alternative r&b"], // ¿Téo?
  "1nSpOxq3pcgomrfpXudQuq": ["east coast hip hop", "boom bap"], // Kirk Knight
  "0nnBZ8FXWjG9wZgM2cpfeb": ["r&b", "neo soul"], // Leon Thomas
  "46SHBwWsqBkxI7EeeBEQG7": ["trap", "southern hip hop"], // Kodak Black
  "6cbCYWLnoGigouoskWVRCx": ["underground hip hop"], // Closed Sessions
  "5Q81rlcTFh3k6DQJXPdsot": ["future bass", "art pop"], // Mura Masa
  "5CCrgHVEWtg8YTEn1UaYug": ["alternative hip hop"], // MellowHype
  "4iXaGootDLE50qY42LCdnK": ["alternative hip hop"], // Deem Spencer
  "6I3MElirhT5t6Kf7p0hGk9": ["alternative hip hop", "funk"], // Duckwrth
  "7vNNmjV14SKQzlQAEg0BXP": ["art pop", "alternative hip hop"], // Jean Dawson
  "65dGLGjkw3UbddUg2GKQoZ": ["nu jazz", "jazz fusion"], // BADBADNOTGOOD
  "7gwpZPmZHIx4B2uLl6uimj": ["underground hip hop", "boom bap"], // Blvck Svm
  "53wZLCnhshZKDRs3uopFBc": ["art pop", "alternative r&b"], // Jai Paul
  "4TEJudQY2pXxVHPE3gD2EU": ["trap", "southern hip hop"], // BlocBoy JB
  "0ocxWXtgr9tJW60xV5ZufT": ["alternative r&b"], // Isaiah Falls
  "2uswTgrrup5AxEu4ke2tks": ["alternative hip hop"], // Ajani Jones
  "6DVipHzYsPlIoA0DW8Gmns": ["east coast hip hop", "hardcore hip hop"], // Royce Da 5'9"
};

// B's picks from the genre review (2026-10-20): these groups win, sharing the artist's plays equally
export const GROUPS_BY_ARTIST = {
  "0cLrgpG3pW4MX4nD8h6qCc": ["rnb", "underground"], // El Michels Affair
  "12Zk1DFhCbHY6v3xep2ZjI": ["rnb"], // 070 Shake
  "2FwDTncULUnmANIh7qKa5z": ["other", "underground"], // FKJ
  "2YZyLoL8N0Wb9xBt1NhZWg": ["west-east", "us-rap"], // Kendrick Lamar
  "3Lz9ODtKKoyV880X2BFtPN": ["underground"], // Jaydee
  "3qBKjEOanahMxlRojwCzhI": ["other", "us-rap"], // Zacari
  "4P4gZvRYiVpvtCkmd37jRM": ["us-rap"], // Malice
  "687cZJR45JO7jhk1LHIbgq": ["afro", "rnb"], // Tems
  "6DJEUXZm0e2rAohdoZ5Voo": ["west-east", "underground"], // Black Thought
  "6Ip8FS7vWT1uKkJSweANQK": ["uk-rap", "afro"], // Dave
  "6LEeAFiJF8OuPx747e1wxR": ["rnb"], // Blood Orange
  "6OmxkansdRyVTvo6BpZzKF": ["underground", "us-rap"], // jev.
  "6eXZu6O7nAUA5z6vLV8NKI": ["uk-rap", "rnb"], // Little Simz
  "6qgnBH6iDM91ipVXv28OMu": ["rnb", "underground"], // KAYTRANADA
  "7BMccF0hQFBpP6417k1OtQ": ["west-east", "underground"], // Action Bronson
  "7ltDVBr6mKbRvohxheJ9h1": ["rnb", "other"], // ROSALÍA
};

const groupOf = genre => GENRE_GROUPS.find(g => g.match.test(genre)).key;

// How one artist's plays split: [{ group, genre, weight }], weights summing to 1. `genre` is the
// Spotify(-style) genre behind the share, or null when nothing names it.
export function genreSplit(artistId, spotifyGenres = []) {
  const all = spotifyGenres.length ? spotifyGenres : GENRES_BY_ARTIST[artistId] ?? [];
  const specific = all.filter(g => !GENERIC.has(g));
  const genres = specific.length ? specific : all;
  const picked = GROUPS_BY_ARTIST[artistId];
  if (picked) {
    return picked.flatMap(group => {
      // A picked group none of the specific genres fall in can still be named by a generic one
      const specificIn = genres.filter(g => groupOf(g) === group);
      const inGroup = specificIn.length ? specificIn : all.filter(g => groupOf(g) === group);
      return inGroup.length
        ? inGroup.map(genre => ({ group, genre, weight: 1 / picked.length / inGroup.length }))
        : [{ group, genre: null, weight: 1 / picked.length }];
    });
  }
  if (!genres.length) return [{ group: 'other', genre: null, weight: 1 }];
  return genres.map(genre => ({ group: groupOf(genre), genre, weight: 1 / genres.length }));
}
