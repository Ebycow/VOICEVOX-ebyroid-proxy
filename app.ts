import assert from 'assert';
import log4js from "log4js";
import fetch from 'node-fetch';
import http from 'http';

log4js.configure('./log4js-config.json');
const logger = log4js.getLogger();

const VOICEVOX_API_PATH = "http://localhost:50021";
const VOICEVOX_OUTPUT_SAMPLING_RATE = 44100;
const VOICEVOX_OUTPUT_BIT_DEPTH = 16;
const VOICEVOX_VOLUME = 2;

const EBYROID_API_PATH = "http://192.168.222.100:4090"


interface AudioQuery {
    outputSamplingRate: number
    volumeScale : number
    outputStereo: boolean
    kana: string
}

interface SynthesisConfig {
    speaker: number
    enableInterrogativeUpspeak: boolean
}


function isAudioQuery(audioQuery: any): audioQuery is AudioQuery {
    if(typeof audioQuery === "object") {
        if(
            // 最低限必要なものがあればよい
            audioQuery.outputSamplingRate != undefined &&
            audioQuery.outputStereo != undefined &&
            audioQuery.kana != undefined &&
            audioQuery.volumeScale != undefined
        ){
            return true;
        }
        return false;
    } else {
        return false;
    }
}

/**
 * VoiceVoxのAPIからAudioQueryを取得
 */
async function getAudioQuery(text: string, config: SynthesisConfig): Promise<AudioQuery> {
    assert(typeof config === 'object');
    assert(typeof config.speaker === 'number');

    const url = new URL(`${ VOICEVOX_API_PATH }/audio_query`);
    url.searchParams.append('text', text);
    url.searchParams.append('speaker', config.speaker.toString());


    const request = await fetch(url.toString(), { method : "POST" });

    const audioQuery = await request.json();

    if (isAudioQuery(audioQuery)) {
        return audioQuery;

    } else {
        throw new Error("Response AudioQuery is not Vaild");
        
    }
        
    
}


function transformAudioQuery(audioQuery: AudioQuery): AudioQuery {
    assert(typeof audioQuery === 'object');

    audioQuery.outputSamplingRate = VOICEVOX_OUTPUT_SAMPLING_RATE;
    audioQuery.volumeScale = VOICEVOX_VOLUME;
    return audioQuery;
}

/**
 * 
 * VoiceVoxのAPIから合成音声を取得
 * 
 */
async function getSynthesisAudio(audioQuery: AudioQuery, config: SynthesisConfig): Promise<Buffer> {
    assert(typeof audioQuery === 'object');
    assert(typeof config.speaker === 'number');
    assert(typeof config.enableInterrogativeUpspeak === 'boolean');

    const url = new URL(`${ VOICEVOX_API_PATH }/synthesis`);
    url.searchParams.append('speaker', config.speaker.toString());
    url.searchParams.append('enable_interrogative_upspeak', config.enableInterrogativeUpspeak.toString());

    const request = await fetch(url.toString(), { 
        method : "POST",
        headers : {
            "Content-Type" : "application/json",
            "Accept" : "audio/wav"
        },
        body : JSON.stringify(audioQuery)
    });
    
    const arrayBuffer = await request.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // wavヘッダーを削除
    for (let i = 0; i <= 44; i++) {
        buffer[i] =  0 
        
    }

    return buffer;

}

interface EbyroidQuery {
    text: string,
    name: string | null

}

function getEbyroidQueryByUrl(url: URL):EbyroidQuery {
    const text = url.searchParams.get('text');
    const name = url.searchParams.get('name');

    if (typeof text == undefined) {
        throw new Error("text query is undefined");
        
    }

    if (typeof text !== "string") {
        throw new Error("text query is not vaild");
        
    }

    return {
        text : text,
        name : name

    }

}


function getEbyroidHeaderByResponse(response: any) {
    const headers = response.headers;
    if(headers.get("Content-Type") !== 'application/octet-stream'){
        throw new Error("Bad content type");
        
        
    }

    const pcmSampleRate: string = headers.get('Ebyroid-PCM-Sample-Rate')
    const pcmBitDepth: string = headers.get('Ebyroid-PCM-Bit-Depth')
    const pcmNumOfChannel: string = headers.get('Ebyroid-PCM-Number-Of-Channels')

    return {
        'application/octet-stream' : 'application/octet-stream',
        'Ebyroid-PCM-Sample-Rate' : pcmSampleRate,
        'Ebyroid-PCM-Bit-Depth' : pcmBitDepth,
        'Ebyroid-PCM-Number-Of-Channels' : pcmNumOfChannel
    }

}

const server = http.createServer(async (request, response) => {
    if(!request.url){
        throw new Error("Request query does not exist");
        
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host}`);

    if(request.method === "GET" && requestUrl.pathname === "/api/v1/audiostream") {

        const ebQuery = getEbyroidQueryByUrl(requestUrl);

        logger.trace("received-query:", "name=", ebQuery.name, " text=", ebQuery.text);

        // ルーティングWIP
        if(ebQuery.name) {
            logger.trace("routed-voicevox-reuqest:", "name=", ebQuery.name, " text=", ebQuery.text);

            const synthesisConfig: SynthesisConfig = { speaker : ebQuery.name ? Number(ebQuery.name) : 0, enableInterrogativeUpspeak  : true };
            let audioQuery = await getAudioQuery(ebQuery.text, synthesisConfig);
            audioQuery = transformAudioQuery(audioQuery);
    
            const synthesisBuffer = await getSynthesisAudio(audioQuery, synthesisConfig);
            logger.trace("response-buffer-length:", synthesisBuffer.length);
    
            const header: http.OutgoingHttpHeaders = {
                'Content-Type': 'application/octet-stream',
                'Ebyroid-PCM-Sample-Rate' : VOICEVOX_OUTPUT_SAMPLING_RATE,
                'Ebyroid-PCM-Bit-Depth' : VOICEVOX_OUTPUT_BIT_DEPTH,
                'Ebyroid-PCM-Number-Of-Channels' : audioQuery.outputStereo ? 2 : 1
            };
    
            response.writeHead(200, header);
            response.end(synthesisBuffer);

        } else { // default
            logger.trace("routed-ebyroid-reuqest:", "name=", ebQuery.name, " text=", ebQuery.text);
            const url = new URL(`${ EBYROID_API_PATH }/api/v1/audiostream`);
            url.searchParams.append('text', ebQuery.text);
            // url.searchParams.append('name', name ); 後でこれがいる

        
            const req = await fetch(url.toString(), { method : "GET" });
            
            const arrayBuffer = await req.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            logger.trace("response-buffer-length:", buffer.length);

            if(req.status == 200){

                const header: http.OutgoingHttpHeaders  = getEbyroidHeaderByResponse(req);

                response.writeHead(200, header);
                response.end(buffer);

            } else {
                throw new Error("Caughted error to Ebyroid response");
                

            }

        }

    } else {
        response.writeHead(400, {'Content-Type': 'text/html; charset=utf-8'});
        response.end('error');

    }
 
});

const PORT: number = 4090;
server.listen(PORT, "0.0.0.0", () => {
    logger.trace(`VOICEBOX-EBYROID-PROXY: Server listen on ${ PORT }`);
})
