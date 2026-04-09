// Clock and Date Update
function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.getElementById('clock').textContent = `${hours}:${minutes}:${seconds}`;
    
    // Greeting logic
    const greetingElement = document.getElementById('greeting');
    const hour = now.getHours();
    let greeting = '반가워요!';
    if (hour >= 5 && hour < 12) greeting = '좋은 아침이에요! ☀️';
    else if (hour >= 12 && hour < 18) greeting = '즐거운 오후네요! ☕';
    else if (hour >= 18 && hour < 22) greeting = '평온한 저녁입니다. 🌙';
    else greeting = '편안한 밤 되세요. ✨';
    
    if (greetingElement) greetingElement.textContent = greeting;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('date').textContent = now.toLocaleDateString('ko-KR', options);
}

setInterval(updateClock, 1000);
updateClock();

// Weather Fetching (Open-Meteo)
async function fetchWeather() {
    const weatherContainer = document.getElementById('weather-content');
    try {
        // 천안 신부동 좌표 설정
        const lat = 36.8190;
        const lon = 127.1583;
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Weather API response error');
        
        const data = await response.json();
        const current = data.current;
        const temp = Math.round(current.temperature_2m);
        const humidity = current.relative_humidity_2m;
        const code = current.weather_code;

        // WMO 날씨 코드 매핑 (한국어)
        const weatherMap = {
            0: '맑음 ☀️',
            1: '대체로 맑음 🌤️',
            2: '구름 조금 ⛅',
            3: '흐림 ☁️',
            45: '안개 🌫️',
            48: '안개 🌫️',
            51: '가벼운 이슬비 🌦️',
            53: '이슬비 🌦️',
            55: '진한 이슬비 🌦️',
            61: '약한 비 🌧️',
            63: '비 🌧️',
            65: '강한 비 🌧️',
            71: '약한 눈 ❄️',
            73: '눈 ❄️',
            75: '폭설 ❄️',
            80: '약한 소나기 🌦️',
            81: '소나기 🌦️',
            82: '강한 소나기 ⛈️',
            95: '뇌우 ⚡'
        };

        const desc = weatherMap[code] || '정보 없음';

        weatherContainer.innerHTML = `
            <div class="weather-info">
                <div class="temp">${temp}°C</div>
                <div class="desc">${desc}</div>
                <div style="margin-top: 10px; font-size: 0.9rem; color: rgba(255,255,255,0.6)">
                    습도: ${humidity}% | 천안 신부동 기준
                </div>
            </div>
        `;
        weatherContainer.classList.remove('loading');
    } catch (error) {
        weatherContainer.innerHTML = '<div style="font-size: 0.9rem;">날씨 정보를 불러올 수 없습니다.<br>잠시 후 다시 시도해주세요.</div>';
        console.error('Weather error:', error);
    }
}

// News Fetching (Multi-Topic Randomization for visual variety)
async function fetchNews() {
    const newsContainer = document.getElementById('news-content');
    const newsTitle = document.querySelector('.news-card h3');
    
    // 다양한 주제의 구글 뉴스 RSS 소스
    const categories = [
        { name: '주요 뉴스', url: 'https://news.google.com/rss?hl=ko&gl=KR&ceid=KR:ko' },
        { name: '정치 뉴스', url: 'https://news.google.com/rss/headlines/section/topic/POLITICS?hl=ko&gl=KR&ceid=KR:ko' },
        { name: '경제 뉴스', url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=ko&gl=KR&ceid=KR:ko' },
        { name: 'IT/과학 뉴스', url: 'https://news.google.com/rss/headlines/section/topic/SCITECH?hl=ko&gl=KR&ceid=KR:ko' },
        { name: '스포츠 뉴스', url: 'https://news.google.com/rss/headlines/section/topic/SPORTS?hl=ko&gl=KR&ceid=KR:ko' }
    ];

    // 매번 다른 주제를 랜덤하게 선택하여 "바뀌는 느낌"을 강화
    const selected = categories[Math.floor(Math.random() * categories.length)];
    const RSS_URL = `${selected.url}&cache=${Date.now()}`;
    
    let proxies = [
        url => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        url => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    ];

    // 프록시 순서 랜덤화
    proxies = proxies.sort(() => Math.random() - 0.5);

    let success = false;

    // 프록시별로 순회하여 뉴스 가져오기 시도
    for (const getProxyUrl of proxies) {
        if (success) break;

        try {
            const response = await fetch(getProxyUrl(RSS_URL));
            if (!response.ok) continue;

            const xmlString = await response.text();
            
            // 데이터가 JSON으로 감싸져 있는지 확인 (allorigins 등의 경우)
            let finalXml = xmlString;
            try {
                const json = JSON.parse(xmlString);
                if (json.contents) finalXml = json.contents;
            } catch(e) { /* JSON이 아니면 그대로 사용 */ }

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(finalXml, "text/xml");
            
            // 파싱 오류 체크
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) continue;

            const items = xmlDoc.querySelectorAll("item");
            
            if (items && items.length > 0) {
                newsContainer.innerHTML = '';
                // 제목 업데이트 (카테고리 표시)
                newsTitle.innerHTML = `<i class="fas fa-newspaper"></i> ${selected.name}`;
                
                for (let i = 0; i < Math.min(items.length, 6); i++) {
                    const item = items[i];
                    let title = item.querySelector("title")?.textContent || '제목 없음';
                    title = title.replace(" - 구글 뉴스", "").replace(" : 연합뉴스", "");
                    const link = item.querySelector("link")?.textContent || "#";
                    
                    const newsItem = document.createElement('div');
                    newsItem.className = 'news-item';
                    newsItem.innerHTML = `<a href="${link}" target="_blank">${title}</a>`;
                    newsContainer.appendChild(newsItem);
                }
                newsContainer.classList.remove('loading');
                success = true;
                break; 
            }
        } catch (error) {
            console.warn('Proxy attempt failed:', error);
            continue;
        }
    }

    if (!success) {
        newsContainer.innerHTML = `
            <div style="font-size: 0.9rem; line-height: 1.6;">
                뉴스를 불러올 수 없습니다.<br>
                <span style="color: var(--text-muted); font-size: 0.8rem;">서버 통신이 원활하지 않습니다.</span><br>
                <button onclick="fetchNews()" style="margin-top:10px; background:var(--primary-color); border:none; color:white; padding:5px 15px; border-radius:5px; cursor:pointer;">다시 시도</button>
            </div>
        `;
    }
}

// Initial calls
fetchWeather();
fetchNews();

// Refresh news every 30 minutes
setInterval(fetchNews, 30 * 60 * 1000);

// Refresh weather every 10 minutes
setInterval(fetchWeather, 10 * 60 * 1000);

// Refresh Button Event Listeners
document.getElementById('refresh-weather').addEventListener('click', function() {
    this.classList.add('spinning');
    const weatherContainer = document.getElementById('weather-content');
    weatherContainer.innerHTML = '불러오는 중...';
    weatherContainer.classList.add('loading');
    fetchWeather().finally(() => {
        setTimeout(() => this.classList.remove('spinning'), 500);
    });
});

document.getElementById('refresh-news').addEventListener('click', function() {
    this.classList.add('spinning');
    const newsContainer = document.getElementById('news-content');
    newsContainer.innerHTML = '불러오는 중...';
    newsContainer.classList.add('loading');
    fetchNews().finally(() => {
        setTimeout(() => this.classList.remove('spinning'), 500);
    });
});
