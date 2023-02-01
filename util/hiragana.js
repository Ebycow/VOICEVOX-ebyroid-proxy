import dictionary from ".//hiragana_data.js";

const isEnglish = (char) => {
    return /^[a-zA-Z]+$/.test(char);
};


function translate(str) {

    str = str.toLowerCase()
    
    let trdText = ""

    var path = str.split(/([a-zA-Z]+|[^a-zA-Z]+)/);
    console.log(path);

    for (const token of path) {
        let targetText = token;
        if(isEnglish(targetText)){
            console.log("target:", targetText);

            function rc(text){
                if(!text){
                    return
                }
                for (let i = text.length; i >= 0; i--) {
                    let word = text.slice(0, i);
                    console.log(word);
                    if (dictionary[word]) {
                        trdText = trdText + dictionary[word];
                        text = text.slice(i);
                        i = text.length + 1;
                    }

                    if(i === 0) {
                        if(text[i]){
                            trdText = trdText + text[i];
                            rc(text.slice(1,text.length))
                        }

                    }
                    
                }
            }

            rc(targetText)
            
        } else {
            trdText += targetText;
        }
        
    }
    
    console.log("trdtext:", trdText);

    return trdText
}


function roman2hiragana(roman) {
    return r2h_recur(roman, '');
}
/**
 * @param {String} roman
 * @param {String} acum hiragana
 * @return {String}
 */
function r2h_recur(roman, acum) {
    var match, target;

    if (roman.length === 0) return acum;
    match = roman.match(regex);
    if (match) {
        target = table[match[0]].split('\t');
        return r2h_recur((target[1] || '') + roman.slice(match[0].length), acum + target[0]);
    } else {
        return r2h_recur(roman.slice(1), acum + roman[0]);
    }
}
  
var table_str = "-	ー\n~	〜\n.	。\n,	、\nz/	・\nz.	…\nz,	‥\nzh	←\nzj	↓\nzk	↑\nzl	→\nz-	〜\nz[	『\nz]	』\n[	「\n]	」\nva	ゔぁ\nvi	ゔぃ\nvu	ゔ\nve	ゔぇ\nvo	ゔぉ\nvya	ゔゃ\nvyi	ゔぃ\nvyu	ゔゅ\nvye	ゔぇ\nvyo	ゔょ\nqq	っ	q\nvv	っ	v\nll	っ	l\nxx	っ	x\nkk	っ	k\ngg	っ	g\nss	っ	s\nzz	っ	z\njj	っ	j\ntt	っ	t\ndd	っ	d\nhh	っ	h\nff	っ	f\nbb	っ	b\npp	っ	p\nmm	っ	m\nyy	っ	y\nrr	っ	r\nww	っ	w\nwww	w	ww\ncc	っ	c\nkya	きゃ\nkyi	きぃ\nkyu	きゅ\nkye	きぇ\nkyo	きょ\ngya	ぎゃ\ngyi	ぎぃ\ngyu	ぎゅ\ngye	ぎぇ\ngyo	ぎょ\nsya	しゃ\nsyi	しぃ\nsyu	しゅ\nsye	しぇ\nsyo	しょ\nsha	しゃ\nshi	し\nshu	しゅ\nshe	しぇ\nsho	しょ\nzya	じゃ\nzyi	じぃ\nzyu	じゅ\nzye	じぇ\nzyo	じょ\ntya	ちゃ\ntyi	ちぃ\ntyu	ちゅ\ntye	ちぇ\ntyo	ちょ\ncha	ちゃ\nchi	ち\nchu	ちゅ\nche	ちぇ\ncho	ちょ\ncya	ちゃ\ncyi	ちぃ\ncyu	ちゅ\ncye	ちぇ\ncyo	ちょ\ndya	ぢゃ\ndyi	ぢぃ\ndyu	ぢゅ\ndye	ぢぇ\ndyo	ぢょ\ntsa	つぁ\ntsi	つぃ\ntse	つぇ\ntso	つぉ\ntha	てゃ\nthi	てぃ\nt'i	てぃ\nthu	てゅ\nthe	てぇ\ntho	てょ\nt'yu	てゅ\ndha	でゃ\ndhi	でぃ\nd'i	でぃ\ndhu	でゅ\ndhe	でぇ\ndho	でょ\nd'yu	でゅ\ntwa	とぁ\ntwi	とぃ\ntwu	とぅ\ntwe	とぇ\ntwo	とぉ\nt'u	とぅ\ndwa	どぁ\ndwi	どぃ\ndwu	どぅ\ndwe	どぇ\ndwo	どぉ\nd'u	どぅ\nnya	にゃ\nnyi	にぃ\nnyu	にゅ\nnye	にぇ\nnyo	にょ\nhya	ひゃ\nhyi	ひぃ\nhyu	ひゅ\nhye	ひぇ\nhyo	ひょ\nbya	びゃ\nbyi	びぃ\nbyu	びゅ\nbye	びぇ\nbyo	びょ\npya	ぴゃ\npyi	ぴぃ\npyu	ぴゅ\npye	ぴぇ\npyo	ぴょ\nfa	ふぁ\nfi	ふぃ\nfu	ふ\nfe	ふぇ\nfo	ふぉ\nfya	ふゃ\nfyu	ふゅ\nfyo	ふょ\nhwa	ふぁ\nhwi	ふぃ\nhwe	ふぇ\nhwo	ふぉ\nhwyu	ふゅ\nmya	みゃ\nmyi	みぃ\nmyu	みゅ\nmye	みぇ\nmyo	みょ\nrya	りゃ\nryi	りぃ\nryu	りゅ\nrye	りぇ\nryo	りょ\nn'	ん\nnn	ん\nxn	ん\na	あ\ni	い\nu	う\nwu	う\ne	え\no	お\nxa	ぁ\nxi	ぃ\nxu	ぅ\nxe	ぇ\nxo	ぉ\nla	ぁ\nli	ぃ\nlu	ぅ\nle	ぇ\nlo	ぉ\nlyi	ぃ\nxyi	ぃ\nlye	ぇ\nxye	ぇ\nye	いぇ\nka	か\nki	き\nku	く\nke	け\nko	こ\nxka	ヵ\nxke	ヶ\nlka	ヵ\nlke	ヶ\nga	が\ngi	ぎ\ngu	ぐ\nge	げ\ngo	ご\nsa	さ\nsi	し\nsu	す\nse	せ\nso	そ\nca	か\nci	し\ncu	く\nce	せ\nco	こ\nqa	くぁ\nqi	くぃ\nqu	く\nqe	くぇ\nqo	くぉ\nkwa	くぁ\nkwi	くぃ\nkwe	くぇ\nkwo	くぉ\ngwa	ぐぁ\nza	ざ\nzi	じ\nzu	ず\nze	ぜ\nzo	ぞ\nja	じゃ\nji	じ\nju	じゅ\nje	じぇ\njo	じょ\njya	じゃ\njyi	じぃ\njyu	じゅ\njye	じぇ\njyo	じょ\nta	た\nti	ち\ntu	つ\ntsu	つ\nte	て\nto	と\nda	だ\ndi	ぢ\ndu	づ\nde	で\ndo	ど\nxtu	っ\nxtsu	っ\nltu	っ\nltsu	っ\nna	な\nni	に\nnu	ぬ\nne	ね\nno	の\nha	は\nhi	ひ\nhu	ふ\nfu	ふ\nhe	へ\nho	ほ\nba	ば\nbi	び\nbu	ぶ\nbe	べ\nbo	ぼ\npa	ぱ\npi	ぴ\npu	ぷ\npe	ぺ\npo	ぽ\nma	ま\nmi	み\nmu	む\nme	め\nmo	も\nxya	ゃ\nlya	ゃ\nya	や\nwyi	ゐ\nxyu	ゅ\nlyu	ゅ\nyu	ゆ\nwye	ゑ\nxyo	ょ\nlyo	ょ\nyo	よ\nra	ら\nri	り\nru	る\nre	れ\nro	ろ\nxwa	ゎ\nlwa	ゎ\nwa	わ\nwi	うぃ\nwe	うぇ\nwo	を\nwha	うぁ\nwhi	うぃ\nwhu	う\nwhe	うぇ\nwho	うぉ\nn	ん";
  
/** @type {Object.<String,String>} */
var table = (function() {
    var table = {};

    table_str.split('\n').forEach(function(row) {
        table[row.match(/^[^\t]+/)] = row.match(/^[^\t]+\t(.+)$/)[1];
    });
    return table;
}());
  
/** @type {RegExp} */
var regex = (function() {
    var key, regexs = [];

    for (key in table) if (table.hasOwnProperty(key)) {
        regexs.push('(?:' + key.replace(/[~(?:)|.*+\[\]]/g, function(s) { return '\\' + s; }) + ')');
    }
    return new RegExp('^(?:' + regexs.join('|') + ')', 'i');
}());

export default translate;