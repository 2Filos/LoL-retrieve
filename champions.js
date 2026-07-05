/**
 * champions.js
 * Riot Data Dragon API wrapper and Champion data caching
 */

/**
 * Fetches Lol version metadata and champion lists from Riot Games' Data Dragon API.
 * Uses localStorage cache to prevent redundant fetches on refresh.
 */
async function loadChampionsList() {
    const cachedData = localStorage.getItem('lol_champions_cache');
    let cache = null;
    if (cachedData) {
        try { cache = JSON.parse(cachedData); } catch (e) { }
    }

    try {
        // Fetch latest patch list from Riot DDragon
        const versions = await fetchDirectOrBridge('https://ddragon.leagueoflegends.com/api/versions.json');
        const latestVersion = versions[0];
        ddragonVersion = latestVersion; // Expose globally for champion portrait icons

        // Check if cache patch is current
        if (cache && cache.version === latestVersion && cache.champions && cache.champions.length > 0) {
            CHAMPIONS = cache.champions;
            console.log(`Loaded champions from cache: Patch ${latestVersion}`);
        } else {
            // Cache is missing or out-of-date: Fetch champion descriptions
            const data = await fetchDirectOrBridge(`https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`);

            // Map object keys to sorted lookup arrays
            CHAMPIONS = Object.values(data.data).map(c => ({
                key: c.id,
                name: c.name
            })).sort((a, b) => a.name.localeCompare(b.name));

            // Write cache back to local storage
            localStorage.setItem('lol_champions_cache', JSON.stringify({
                version: latestVersion,
                champions: CHAMPIONS
            }));
            console.log(`Cached champions: Patch ${latestVersion}`);
        }
    } catch (err) {
        console.warn("Could not fetch fresh champion list. Using cache or defaults.", err);
        if (cache && cache.champions) {
            CHAMPIONS = cache.champions;
        } else {
            // Offline fail-safe static champion list
            CHAMPIONS = [
                { key: "Aatrox", name: "Aatrox" }, { key: "Ahri", name: "Ahri" }, { key: "Akali", name: "Akali" },
                { key: "Akshan", name: "Akshan" }, { key: "Alistar", name: "Alistar" }, { key: "Amumu", name: "Amumu" },
                { key: "Anivia", name: "Anivia" }, { key: "Annie", name: "Annie" }, { key: "Aphelios", name: "Aphelios" },
                { key: "Ashe", name: "Ashe" }, { key: "AurelionSol", name: "Aurelion Sol" }, { key: "Azir", name: "Azir" },
                { key: "Bard", name: "Bard" }, { key: "Belveth", name: "Bel'Veth" }, { key: "Blitzcrank", name: "Blitzcrank" },
                { key: "Brand", name: "Brand" }, { key: "Braum", name: "Braum" }, { key: "Briar", name: "Briar" },
                { key: "Caitlyn", name: "Caitlyn" }, { key: "Camille", name: "Camille" }, { key: "Cassiopeia", name: "Cassiopeia" },
                { key: "Chogath", name: "Cho'Gath" }, { key: "Corki", name: "Corki" }, { key: "Darius", name: "Darius" },
                { key: "Diana", name: "Diana" }, { key: "DrMundo", name: "Dr. Mundo" }, { key: "Draven", name: "Draven" },
                { key: "Ekko", name: "Ekko" }, { key: "Elise", name: "Elise" }, { key: "Evelynn", name: "Evelynn" },
                { key: "Ezreal", name: "Ezreal" }, { key: "Fiddlesticks", name: "Fiddlesticks" }, { key: "Fiora", name: "Fiora" },
                { key: "Fizz", name: "Fizz" }, { key: "Galio", name: "Galio" }, { key: "Gangplank", name: "Gangplank" },
                { key: "Garen", name: "Garen" }, { key: "Gnar", name: "Gnar" }, { key: "Gragas", name: "Gragas" },
                { key: "Graves", name: "Graves" }, { key: "Gwen", name: "Gwen" }, { key: "Hecarim", name: "Hecarim" },
                { key: "Heimerdinger", name: "Heimerdinger" }, { key: "Hwei", name: "Hwei" }, { key: "Illaoi", name: "Illaoi" },
                { key: "Irelia", name: "Irelia" }, { key: "Ivern", name: "Ivern" }, { key: "Janna", name: "Janna" },
                { key: "JarvanIV", name: "Jarvan IV" }, { key: "Jax", name: "Jax" }, { key: "Jayce", name: "Jayce" },
                { key: "Jhin", name: "Jhin" }, { key: "Jinx", name: "Jinx" }, { key: "Ksante", name: "K'Sante" },
                { key: "Kaisa", name: "Kai'Sa" }, { key: "Kalista", name: "Kalista" }, { key: "Karma", name: "Karma" },
                { key: "Karthus", name: "Karthus" }, { key: "Kassadin", name: "Kassadin" }, { key: "Katarina", name: "Katarina" },
                { key: "Kayle", name: "Kayle" }, { key: "Kayn", name: "Kayn" }, { key: "Kennen", name: "Kennen" },
                { key: "Khazix", name: "Kha'Zix" }, { key: "Kindred", name: "Kindred" }, { key: "Kled", name: "Kled" },
                { key: "KogMaw", name: "Kog'Maw" }, { key: "Leblanc", name: "LeBlanc" }, { key: "LeeSin", name: "Lee Sin" },
                { key: "Leona", name: "Leona" }, { key: "Lillia", name: "Lillia" }, { key: "Lissandra", name: "Lissandra" },
                { key: "Lucian", name: "Lucian" }, { key: "Lulu", name: "Lulu" }, { key: "Lux", name: "Lux" },
                { key: "Malphite", name: "Malphite" }, { key: "Malzahar", name: "Malzahar" }, { key: "Maokai", name: "Maokai" },
                { key: "MasterYi", name: "Master Yi" }, { key: "Milio", name: "Milio" }, { key: "MissFortune", name: "Miss Fortune" },
                { key: "Mordekaiser", name: "Mordekaiser" }, { key: "Morgana", name: "Morgana" }, { key: "Naafiri", name: "Naafiri" },
                { key: "Nami", name: "Nami" }, { key: "Nasus", name: "Nasus" }, { key: "Nautilus", name: "Nautilus" },
                { key: "Neeko", name: "Neeko" }, { key: "Nidalee", name: "Nidalee" }, { key: "Nilah", name: "Nilah" },
                { key: "Nocturne", name: "Nocturne" }, { key: "Nunu", name: "Nunu & Willump" }, { key: "Olaf", name: "Olaf" },
                { key: "Orianna", name: "Orianna" }, { key: "Ornn", name: "Ornn" }, { key: "Pantheon", name: "Pantheon" },
                { key: "Poppy", name: "Poppy" }, { key: "Pyke", name: "Pyke" }, { key: "Qiyana", name: "Qiyana" },
                { key: "Quinn", name: "Quinn" }, { key: "Rakan", name: "Rakan" }, { key: "Rammus", name: "Rammus" },
                { key: "RekSai", name: "Rek'Sai" }, { key: "Rell", name: "Rell" }, { key: "Renata", name: "Renata Glasc" },
                { key: "Renekton", name: "Renekton" }, { key: "Rengar", name: "Rengar" }, { key: "Riven", name: "Riven" },
                { key: "Rumble", name: "Rumble" }, { key: "Ryze", name: "Ryze" }, { key: "Samira", name: "Samira" },
                { key: "Sejuani", name: "Sejuani" }, { key: "Senna", name: "Senna" }, { key: "Seraphine", name: "Seraphine" },
                { key: "Sett", name: "Sett" }, { key: "Shaco", name: "Shaco" }, { key: "Shen", name: "Shen" },
                { key: "Shyvana", name: "Shyvana" }, { key: "Singed", name: "Singed" }, { key: "Sion", name: "Sion" },
                { key: "Sivir", name: "Sivir" }, { key: "Skarner", name: "Skarner" }, { key: "Sona", name: "Sona" },
                { key: "Soraka", name: "Soraka" }, { key: "Swain", name: "Swain" }, { key: "Sylas", name: "Sylas" },
                { key: "Syndra", name: "Syndra" }, { key: "TahmKench", name: "Tahm Kench" }, { key: "Taliyah", name: "Taliyah" },
                { key: "Talon", name: "Talon" }, { key: "Taric", name: "Taric" }, { key: "Teemo", name: "Teemo" },
                { key: "Thresh", name: "Thresh" }, { key: "Tristana", name: "Tristana" }, { key: "Trundle", name: "Trundle" },
                { key: "Tryndamere", name: "Tryndamere" }, { key: "TwistedFate", name: "Twisted Fate" }, { key: "Twitch", name: "Twitch" },
                { key: "Udyr", name: "Udyr" }, { key: "Urgot", name: "Urgot" }, { key: "Varus", name: "Varus" },
                { key: "Vayne", name: "Vayne" }, { key: "Veigar", name: "Veigar" }, { key: "Velkoz", name: "Vel'Koz" },
                { key: "Vex", name: "Vex" }, { key: "Vi", name: "Vi" }, { key: "Viego", name: "Viego" },
                { key: "Viktor", name: "Viktor" }, { key: "Vladimir", name: "Vladimir" }, { key: "Volibear", name: "Volibear" },
                { key: "Warwick", name: "Warwick" }, { key: "Wukong", name: "Wukong" }, { key: "Xayah", name: "Xayah" },
                { key: "Xerath", name: "Xerath" }, { key: "XinZhao", name: "Xin Zhao" }, { key: "Yasuo", name: "Yasuo" },
                { key: "Yone", name: "Yone" }, { key: "Yorick", name: "Yorick" }, { key: "Yuumi", name: "Yuumi" },
                { key: "Zac", name: "Zac" }, { key: "Zed", name: "Zed" }, { key: "Zeri", name: "Zeri" },
                { key: "Ziggs", name: "Ziggs" }, { key: "Zilean", name: "Zilean" }, { key: "Zoe", name: "Zoe" },
                { key: "Zyra", name: "Zyra" }
            ];
        }
    }

    // Bind catalog results to search dropdowns
    const dl = document.getElementById('championList');
    if (dl) {
        dl.innerHTML = '';
        CHAMPIONS.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            dl.appendChild(opt);
        });
    }

    // Enable interaction elements
    document.getElementById('enemyChamp').disabled = false;
    document.getElementById('myChamp').disabled = false;
    document.getElementById('loadBtn').disabled = false;
}
