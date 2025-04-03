// Speedtest Worker
let testState = -1; // -1=not started, 0=starting, 1=download test, 2=ping+jitter test, 3=upload test, 4=finished, 5=aborted
let dlStatus = 0; // download speed in mbps
let ulStatus = 0; // upload speed in mbps
let pingStatus = 0; // ping in ms
let jitterStatus = 0; // jitter in ms
let dlProgress = 0; // progress of download test 0-1
let ulProgress = 0; // progress of upload test 0-1
let pingProgress = 0; // progress of ping test 0-1
let settings = {
  time_ul_max: 15, // max duration of upload test in seconds
  time_dl_max: 15, // max duration of download test in seconds
  time_auto: true, // shorten test on fast connections
  time_ulGraceTime: 3, // wait for buffers to fill
  time_dlGraceTime: 1.5, // wait for TCP window to increase
  count_ping: 10, // number of pings to perform
  xhr_dlMultistream: 6, // number of download streams
  xhr_ulMultistream: 3, // number of upload streams
  xhr_multistreamDelay: 300, // delay between concurrent requests
  overheadCompensationFactor: 1.06, // compensate for network overhead
  useMebibits: false, // use megabits/s instead of mebibits/s
  url_dl: '', // URL for download test
  url_ul: '', // URL for upload test
  url_ping: '' // URL for ping test
};

function clearResults() {
  testState = -1;
  dlStatus = 0;
  ulStatus = 0;
  pingStatus = 0;
  jitterStatus = 0;
  dlProgress = 0;
  ulProgress = 0;
  pingProgress = 0;
}

function sendStatus() {
  postMessage(JSON.stringify({
    testState: testState,
    dlStatus: dlStatus,
    ulStatus: ulStatus,
    pingStatus: pingStatus,
    jitterStatus: jitterStatus,
    dlProgress: dlProgress,
    ulProgress: ulProgress,
    pingProgress: pingProgress
  }));
}

// Generate random data for upload
function generateRandomData(size) {
  const data = new Uint8Array(size);
  const chunkSize = 65536; // 64KB chunks for crypto API
  const value = new Uint8Array(chunkSize);
  crypto.getRandomValues(value);
  
  for (let offset = 0; offset < size; offset += chunkSize) {
    const slice = Math.min(chunkSize, size - offset);
    data.set(value.slice(0, slice), offset);
  }
  
  return data;
}

// Measure download speed
async function measureDownload() {
  try {
    testState = 1;
    dlStatus = 0;
    dlProgress = 0;

    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    let graceTimeDone = false;
    let startTime = performance.now();
    let bonusTime = 0;
    let speedSamples = [];
    let totalDownloaded = 0;

    // Use multiple concurrent downloads
    const workers = Array(settings.xhr_dlMultistream).fill(0).map(async (_, index) => {
      await new Promise(r => setTimeout(r, settings.xhr_multistreamDelay * index));
      
      while (performance.now() - startTime < settings.time_dl_max * 1000) {
        const timestamp = Date.now();
        const url = `${settings.url_dl}&bytes=${CHUNK_SIZE}&t=${timestamp}&w=${index}`;
        
        const response = await fetch(url, {
          cache: 'no-store',
          headers: { 
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }

        const data = await response.arrayBuffer();
        if (data.byteLength === 0) continue;

        const now = performance.now();
        const duration = now - startTime;
        
        if (!graceTimeDone) {
          if (duration > settings.time_dlGraceTime * 1000) {
            if (totalDownloaded > 0) {
              startTime = now;
              bonusTime = 0;
              totalDownloaded = 0;
            }
            graceTimeDone = true;
          }
        } else {
          totalDownloaded += data.byteLength;
          const speed = (totalDownloaded * 8) / ((duration / 1000) * 1000000) * settings.overheadCompensationFactor;
          
          if (settings.time_auto) {
            // Shorten test for fast connections
            const bonus = (6.4 * speed) / 100000;
            bonusTime += bonus > 800 ? 800 : bonus;
          }

          dlStatus = speed;
          speedSamples.push(speed);
          dlProgress = Math.min((duration + bonusTime) / (settings.time_dl_max * 1000), 1);
          sendStatus();

          if ((duration + bonusTime) / 1000 > settings.time_dl_max) {
            break;
          }
        }
      }
    });

    await Promise.all(workers);
    
    if (totalDownloaded === 0) {
      throw new Error('No data was downloaded');
    }

    // Calculate final speed using top 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => b - a);
    const topSpeedCount = Math.max(1, Math.floor(speedSamples.length * 0.1));
    dlStatus = sortedSpeeds.slice(0, topSpeedCount).reduce((a, b) => a + b, 0) / topSpeedCount;
    dlProgress = 1;
    sendStatus();
  } catch (error) {
    console.error('Download test error:', error);
    testState = 5;
    sendStatus();
  }
}

// Measure upload speed
async function measureUpload() {
  try {
    testState = 3;
    ulStatus = 0;
    ulProgress = 0;

    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    let graceTimeDone = false;
    let startTime = performance.now();
    let bonusTime = 0;
    let speedSamples = [];
    let totalUploaded = 0;

    // Generate test data once and reuse
    const data = generateRandomData(CHUNK_SIZE);

    // Use multiple concurrent uploads
    const workers = Array(settings.xhr_ulMultistream).fill(0).map(async (_, index) => {
      await new Promise(r => setTimeout(r, settings.xhr_multistreamDelay * index));
      
      while (performance.now() - startTime < settings.time_ul_max * 1000) {
        const response = await fetch(settings.url_ul, {
          method: 'POST',
          body: data,
          headers: {
            'Content-Type': 'application/octet-stream'
          }
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const now = performance.now();
        const duration = now - startTime;
        
        if (!graceTimeDone) {
          if (duration > settings.time_ulGraceTime * 1000) {
            if (totalUploaded > 0) {
              startTime = now;
              bonusTime = 0;
              totalUploaded = 0;
            }
            graceTimeDone = true;
          }
        } else {
          totalUploaded += data.length;
          const speed = (totalUploaded * 8) / ((duration / 1000) * 1000000) * settings.overheadCompensationFactor;
          
          if (settings.time_auto) {
            // Shorten test for fast connections
            const bonus = (6.4 * speed) / 100000;
            bonusTime += bonus > 800 ? 800 : bonus;
          }

          ulStatus = speed;
          speedSamples.push(speed);
          ulProgress = Math.min((duration + bonusTime) / (settings.time_ul_max * 1000), 1);
          sendStatus();

          if ((duration + bonusTime) / 1000 > settings.time_ul_max) {
            break;
          }
        }
      }
    });

    await Promise.all(workers);
    
    if (totalUploaded === 0) {
      throw new Error('No data was uploaded');
    }

    // Calculate final speed using top 10% of samples
    const sortedSpeeds = speedSamples.sort((a, b) => b - a);
    const topSpeedCount = Math.max(1, Math.floor(speedSamples.length * 0.1));
    ulStatus = sortedSpeeds.slice(0, topSpeedCount).reduce((a, b) => a + b, 0) / topSpeedCount;
    ulProgress = 1;
    sendStatus();
  } catch (error) {
    console.error('Upload test error:', error);
    testState = 5;
    sendStatus();
  }
}

// Measure ping and jitter
async function measurePing() {
  try {
    testState = 2;
    pingStatus = 0;
    jitterStatus = 0;
    pingProgress = 0;

    const pings = [];
    let prevPing = 0;
    
    for (let i = 0; i < settings.count_ping; i++) {
      const start = performance.now();
      const response = await fetch(settings.url_ping + (settings.url_ping.includes('?') ? '&' : '?') + 'r=' + Math.random(), {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) throw new Error(`Ping failed: ${response.status}`);
      
      const end = performance.now();
      const pingTime = end - start;

      if (i === 0) {
        pingStatus = pingTime;
      } else {
        if (pingTime < pingStatus) pingStatus = pingTime;
        const jitter = Math.abs(pingTime - prevPing);
        if (i === 1) jitterStatus = jitter;
        else jitterStatus = jitter > jitterStatus ? 
          jitterStatus * 0.3 + jitter * 0.7 : 
          jitterStatus * 0.8 + jitter * 0.2;
      }

      prevPing = pingTime;
      pingProgress = (i + 1) / settings.count_ping;
      sendStatus();
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } catch (error) {
    console.error('Ping test error:', error);
    testState = 5;
    sendStatus();
  }
}

// Handle messages from main thread
onmessage = async function(e) {
  const message = e.data;
  
  if (message === 'status') {
    sendStatus();
  } else if (message === 'abort') {
    testState = 5;
    sendStatus();
  } else if (message.startsWith('start ')) {
    clearResults();
    const customSettings = JSON.parse(message.substring(6));
    settings = { ...settings, ...customSettings };
    testState = 0;
    sendStatus();

    // Run tests in sequence
    await measurePing();
    if (testState !== 5) await measureDownload();
    if (testState !== 5) await measureUpload();
    
    if (testState !== 5) {
      testState = 4;
      sendStatus();
    }
  }
}; 