import assert from 'assert';
import log4js from "log4js";
import fetch from 'node-fetch';
import http from 'http';
import r2h from './util.js';

log4js.configure('./log4js-config.json');
const logger = log4js.getLogger();

const VOICEVOX_API_PATH = "http://localhost:50021";
const VOICEVOX_OUTPUT_SAMPLING_RATE = 44100;
const VOICEVOX_OUTPUT_BIT_DEPTH = 16;
const VOICEVOX_VOLUME = 2;

/**
 * VoiceVoxのAudioQuery
 * @typedef {{
 *  outputSamplingRate : number
 *  outputStereo : bool
 *  kana : string
 * }} AudioQuery
 */

/**
 * VoiceVox音声合成設定の包括的なプロパティ
 * @typedef {{
 *  speaker : number
 *  enableInterrogativeUpspeak : bool
 * }} SynthesisConfig
 */

/**
 * VoiceVoxのAPIからAudioQueryを取得
 *
 * @param {string} text
 * @param {SynthesisConfig} config
 * @returns {AudioQuery} 
 */
async function getAudioQuery(text, config){
    assert(typeof config === 'object');
    assert(typeof config.speaker === 'number');

    const url = new URL(`${ VOICEVOX_API_PATH }/audio_query`);
    url.searchParams.append('text', text);
    url.searchParams.append('speaker', config.speaker);

    const request = await fetch(url.toString(), { method : "POST" });
    const audioQuery = await request.json();

    return audioQuery;

}

/**
 * VoiceVoxのAudioQuery設定を変換
 *
 * @param {AudioQuery} audioQuery
 * @returns {AudioQuery} 
 */
function transformAudioQuery(audioQuery) {
    assert(typeof audioQuery === 'object');

    audioQuery.outputSamplingRate = VOICEVOX_OUTPUT_SAMPLING_RATE;
    audioQuery.volumeScale = VOICEVOX_VOLUME;
    return audioQuery;
}

/**
 * 
 *
 * @param {AudioQuery} audioQuery
 * @param {number} speaker
 * @param {SynthesisConfig} config
 * @returns {Buffer} 
 * 
 */
async function getSynthesisAudio(audioQuery, config) {
    assert(typeof audioQuery === 'object');
    assert(typeof config.speaker === 'number');
    assert(typeof config.enableInterrogativeUpspeak === 'boolean');

    const url = new URL(`${ VOICEVOX_API_PATH }/synthesis`);
    url.searchParams.append('speaker', config.speaker);
    url.searchParams.append('enable_interrogative_upspeak', config.enableInterrogativeUpspeak);

    const request = await fetch(url.toString(), { 
        method : "POST",
        headers : {
            "Content-Type" : "application/json",
            "Accept" : "audio/wav"
        },
        body : JSON.stringify(audioQuery)
    });
    
    const arrayBuffer = await request.arrayBuffer();
    const buffer = new Buffer.from(arrayBuffer);

    // wavヘッダーを削除
    for (let i = 0; i <= 44; i++) {
        buffer[i] =  0 
        
    }

    const body = buffer;

    return body;

}


const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    if(request.method === "GET" && requestUrl.pathname === "/api/v1/audiostream") {

        const text = r2h(requestUrl.searchParams.get('text'));
        const name = requestUrl.searchParams.get('name');

        // 要例外処理

        const synthesisConfig = { speaker : name ? Number(name) : 0, enableInterrogativeUpspeak  : true };
        let audioQuery = await getAudioQuery(text, synthesisConfig);
        audioQuery = transformAudioQuery(audioQuery);

        const synthesis = await getSynthesisAudio(audioQuery, synthesisConfig);
        logger.trace("requested-buffer-length:", synthesis.length);

        response.writeHead(200, {
            'Content-Type': 'application/octet-stream',
            'Ebyroid-PCM-Sample-Rate' : VOICEVOX_OUTPUT_SAMPLING_RATE,
            'Ebyroid-PCM-Bit-Depth' : VOICEVOX_OUTPUT_BIT_DEPTH,
            'Ebyroid-PCM-Number-Of-Channels' : audioQuery.outputStereo ? 2 : 1
        });
        
        response.end(synthesis);

    } else {
        response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        response.end('error');

    }
 
});

server.listen(4090, "0.0.0.0", () => {
    logger.trace(`VOICEBOX-EBYROID-PROXY: Server listen on ${ server.address().port }`);
})
