import React, { useEffect, useMemo, useRef, useState } from 'react';
import './WorldExplorer.css';
import { worldPlaces, worldPlaceFilters } from './worldPlaces';

const mapCopy = {
  english: {
    eyebrow: 'A map full of wonders', title: 'World Explorer',
    placeCount: (count) => `${count} discoveries to explore`, loading: 'Finding live wildlife records…',
    more: 'Find more wildlife', loadingMore: 'Looking for more…', noMore: 'No new records found just now. Try again later.',
    liveNote: 'Wildlife pins show approximate, rounded observation areas from GBIF records.',
    liveUnavailable: 'Live nature records could not load just now. Here are some discoveries to explore instead.',
    liveFact: (_name, region) => `Nature observers have recorded this living thing in ${region}. This pin marks an approximate area, not an exact sighting.`,
    liveQuestion: 'What might help this living thing thrive in its habitat?',
    summaryLoading: 'Finding a short encyclopedia description…',
    closeDetails: 'Close discovery details', observedHere: 'Where it was seen', exploreHere: 'About this place',
    imageLoading: 'Finding a picture…',
    imageUnavailable: 'No picture is available for this discovery yet.',
    photoCredit: (creator) => `Photo: ${creator}`, imageLicense: 'Image license', commonsCredit: 'Wikimedia Commons image · credit and license',
    wikipediaSource: 'Read on Wikipedia',
    description: 'Tap a place to meet something that lives, grows, or formed there.',
    filtersLabel: 'Filter map places', note: 'Pins show broad habitats and places, not exact animal locations.',
    empty: 'Pick a pin to discover something from that part of the world.', wonder: 'Wonder', source: 'Source',
    mapAlt: 'Illustrated map of Earth with tappable discovery places',
    zoomLabel: 'Map zoom controls', zoomIn: 'Zoom in on the map', zoomOut: 'Zoom out on the map', resetZoom: 'Reset map view', panHint: 'Drag the map to explore nearby pins.',
    filters: { 'All places': 'All places', Birds: 'Birds', Animals: 'Animals', Plants: 'Plants', Ocean: 'Ocean', 'Earth wonders': 'Earth wonders', Fossils: 'Fossils' },
    marker: (name, region) => `Explore ${name} in ${region}`,
    continents: ['NORTH AMERICA', 'SOUTH AMERICA', 'AFRICA', 'ASIA', 'AUSTRALIA', 'ANTARCTICA'],
  },
  hindi: {
    eyebrow: 'कमाल की जगहों का नक्शा', title: 'दुनिया की खोज',
    placeCount: (count) => `${count} खोजें`, loading: 'जीवों के नए रिकॉर्ड खोज रहे हैं…',
    more: 'और जीव खोजो', loadingMore: 'और खोज रहे हैं…', noMore: 'अभी नए रिकॉर्ड नहीं मिले। बाद में फिर कोशिश करो।',
    liveNote: 'जीवों के पिन GBIF रिकॉर्ड से मिले अनुमानित इलाके दिखाते हैं।',
    liveUnavailable: 'अभी नए रिकॉर्ड नहीं मिल पाए। तब तक ये खोजें देखो।',
    liveFact: (_name, region) => `प्रकृति के पर्यवेक्षकों ने इस जीव को ${region} में दर्ज किया है। पिन अनुमानित इलाका दिखाता है, सटीक जगह नहीं।`,
    liveQuestion: 'इस जीव को अपने घर में पनपने में क्या मदद मिलती होगी?',
    summaryLoading: 'छोटा विश्वकोश विवरण ढूँढ रहे हैं…',
    closeDetails: 'खोज की जानकारी बंद करें', observedHere: 'यहाँ देखा गया', exploreHere: 'इस जगह के बारे में',
    imageLoading: 'तस्वीर ढूँढ रहे हैं…',
    imageUnavailable: 'इस खोज की तस्वीर अभी नहीं मिली।',
    photoCredit: (creator) => `फ़ोटो: ${creator}`, imageLicense: 'तस्वीर का लाइसेंस', commonsCredit: 'विकिमीडिया कॉमन्स तस्वीर · श्रेय और लाइसेंस',
    wikipediaSource: 'विकिपीडिया पर पढ़ो',
    description: 'किसी जगह को छूकर वहाँ रहने वाले जीव या बनी हुई चीज़ों से मिलो।',
    filtersLabel: 'नक्शे की जगहें छाँटें', note: 'पिन बड़े इलाक़े दिखाते हैं, जानवरों की सटीक जगह नहीं।',
    empty: 'दुनिया के किसी हिस्से को जानने के लिए एक पिन चुनो।', wonder: 'सोचो', source: 'जानकारी का स्रोत',
    mapAlt: 'धरती का चित्र वाला नक्शा, जहाँ खोजने के लिए जगहें हैं',
    zoomLabel: 'नक्शे का ज़ूम', zoomIn: 'नक्शे को बड़ा करें', zoomOut: 'नक्शे को छोटा करें', resetZoom: 'नक्शे का दृश्य रीसेट करें', panHint: 'आस-पास के पिन देखने के लिए नक्शे को खिसकाएँ।',
    filters: { 'All places': 'सभी जगहें', Birds: 'पक्षी', Animals: 'जानवर', Plants: 'पौधे', Ocean: 'समुद्र', 'Earth wonders': 'धरती के कमाल', Fossils: 'जीवाश्म' },
    marker: (name, region) => `${region} में ${name} देखो`,
    continents: ['उत्तर अमेरिका', 'दक्षिण अमेरिका', 'अफ्रीका', 'एशिया', 'ऑस्ट्रेलिया', 'अंटार्कटिका'],
  },
  hinglish: {
    eyebrow: 'Duniya ke wonders ka map', title: 'World Explorer',
    placeCount: (count) => `${count} discoveries explore karo`, loading: 'Naye wildlife records dhoondh rahe hain…',
    more: 'Aur wildlife dhoondo', loadingMore: 'Aur dhoondh rahe hain…', noMore: 'Abhi naye records nahi mile. Baad mein phir try karo.',
    liveNote: 'Wildlife pins GBIF records se mile approximate area dikhate hain.',
    liveUnavailable: 'Abhi naye records nahi mil paaye. Tab tak yeh discoveries dekho.',
    liveFact: (_name, region) => `Nature observers ne is living thing ko ${region} mein record kiya hai. Pin approximate area dikhata hai, exact jagah nahi.`,
    liveQuestion: 'Is living thing ko apne habitat mein badhne ke liye kya madad milti hogi?',
    summaryLoading: 'Chhota encyclopedia description dhoondh rahe hain…',
    closeDetails: 'Discovery details band karo', observedHere: 'Yahaan dekha gaya', exploreHere: 'Is jagah ke baare mein',
    imageLoading: 'Tasveer dhoondh rahe hain…',
    imageUnavailable: 'Is discovery ki tasveer abhi nahi mili.',
    photoCredit: (creator) => `Photo: ${creator}`, imageLicense: 'Image license', commonsCredit: 'Wikimedia Commons image · credit aur license',
    wikipediaSource: 'Wikipedia par padho',
    description: 'Kisi jagah ko tap karke wahan rehne ya banne wali cheez se milo.',
    filtersLabel: 'Map ki jagah chhanto', note: 'Pins bade ilaake dikhate hain, janwaron ki exact jagah nahi.',
    empty: 'Duniya ke kisi hisse ko jaanne ke liye ek pin chuno.', wonder: 'Socho', source: 'Source',
    mapAlt: 'Duniya ka illustrated map jismein explore karne ki jagahen hain',
    zoomLabel: 'Map zoom controls', zoomIn: 'Map zoom in karo', zoomOut: 'Map zoom out karo', resetZoom: 'Map view reset karo', panHint: 'Paas ke pins dekhne ke liye map ko drag karo.',
    filters: { 'All places': 'Sab jagah', Birds: 'Birds', Animals: 'Janwar', Plants: 'Plants', Ocean: 'Ocean', 'Earth wonders': 'Earth wonders', Fossils: 'Fossils' },
    marker: (name, region) => `${region} mein ${name} dekho`,
    continents: ['NORTH AMERICA', 'SOUTH AMERICA', 'AFRICA', 'ASIA', 'AUSTRALIA', 'ANTARCTICA'],
  },
};

const GBIF_API = 'https://api.gbif.org/v1';
const MD5_SHIFTS = [7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21];
const MD5_CONSTANTS = Array.from({ length: 64 }, (_, index) => Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000));

function md5Hex(value) {
  const input = new TextEncoder().encode(value);
  const paddedLength = Math.ceil((input.length + 9) / 64) * 64;
  const bytes = new Uint8Array(paddedLength);
  bytes.set(input);
  bytes[input.length] = 0x80;
  const view = new DataView(bytes.buffer);
  const bitLength = input.length * 8;
  view.setUint32(paddedLength - 8, bitLength >>> 0, true);
  view.setUint32(paddedLength - 4, Math.floor(bitLength / 0x100000000), true);
  let a0 = 0x67452301; let b0 = 0xefcdab89; let c0 = 0x98badcfe; let d0 = 0x10325476;
  for (let offset = 0; offset < paddedLength; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true));
    let a = a0; let b = b0; let c = c0; let d = d0;
    for (let index = 0; index < 64; index += 1) {
      let f; let g;
      if (index < 16) { f = (b & c) | (~b & d); g = index; }
      else if (index < 32) { f = (d & b) | (~d & c); g = (5 * index + 1) % 16; }
      else if (index < 48) { f = b ^ c ^ d; g = (3 * index + 5) % 16; }
      else { f = c ^ (b | ~d); g = (7 * index) % 16; }
      const sum = (a + f + MD5_CONSTANTS[index] + words[g]) >>> 0;
      const shift = MD5_SHIFTS[index];
      const rotated = ((sum << shift) | (sum >>> (32 - shift))) >>> 0;
      const previousD = d;
      d = c; c = b; b = (b + rotated) >>> 0; a = previousD;
    }
    a0 = (a0 + a) >>> 0; b0 = (b0 + b) >>> 0; c0 = (c0 + c) >>> 0; d0 = (d0 + d) >>> 0;
  }
  return [a0, b0, c0, d0].map((word) => [0, 8, 16, 24].map((shift) => ((word >>> shift) & 0xff).toString(16).padStart(2, '0')).join('')).join('');
}

function mapCoordinates(latitude, longitude) {
  return {
    x: Math.min(98, Math.max(2, ((longitude + 180) / 360) * 100)),
    y: Math.min(94, Math.max(4, ((90 - latitude) / 180) * 100)),
  };
}

function getDiscoveryIcon(record, category) {
  const classification = [record.vernacularName, record.species, record.scientificName, record.family, record.order, record.class]
    .filter(Boolean).join(' ').toLowerCase();
  const icons = category === 'Plants'
    ? [
      [/water.?lily|lotus|nelumbo|nymphaea/, '🪷'], [/orchid|orchidaceae/, '🌸'], [/rose|rosa/, '🌹'],
      [/cactus|cactaceae/, '🌵'], [/palm|arecaceae/, '🌴'], [/bamboo|bambusoideae/, '🎋'],
      [/mushroom|fungus|fungi/, '🍄'], [/fern|pteridophyte/, '🌿'], [/grass|wheat|rice|poaceae/, '🌾'],
      [/tree|oak|quercus|sequoia|baobab/, '🌳'], [/pine|conifer|pinus/, '🌲'],
    ]
    : [
      [/penguin|sphenisc|apt(en|o)odytes/, '🐧'], [/kiwi|apteryx/, '🐦'], [/owl|strigiform/, '🦉'],
      [/eagle|accipitridae/, '🦅'], [/parrot|psittac/, '🦜'], [/flamingo|phoenicopter/, '🦩'],
      [/duck|goose|swan|anatidae/, '🦆'], [/toucan|ramphastidae/, '🐦'], [/hummingbird|trochilidae/, '🐦'],
      [/butterfly|moth|lepidoptera/, '🦋'],
      [/tiger|tigris/, '🐅'], [/jaguar|leopard|panthera pardus/, '🐆'], [/lion|panthera leo/, '🦁'],
      [/panda|ailuropoda/, '🐼'], [/polar bear|ursus maritimus/, '🐻‍❄️'], [/bear|ursus/, '🐻'],
      [/elephant|loxodonta|elephas/, '🐘'], [/giraffe|giraffa/, '🦒'], [/zebra|equus quagga/, '🦓'],
      [/whale|balaenoptera|megaptera/, '🐋'], [/dolphin|delphinidae/, '🐬'], [/shark|selachimorpha/, '🦈'],
      [/octopus|octopoda/, '🐙'], [/squid|teuthida/, '🦑'], [/crab|brachyura/, '🦀'],
      [/turtle|tortoise|testudines|chelonoidis/, '🐢'], [/snake|serpentes|python/, '🐍'],
      [/frog|toad|anura/, '🐸'], [/bee|apis|bumblebee/, '🐝'], [/bat|chiroptera/, '🦇'],
      [/crocodile|alligator|crocodylia/, '🐊'], [/monkey|primate|orangutan|pongo/, '🐒'],
      [/fox|vulpes/, '🦊'], [/deer|cervidae/, '🦌'], [/rabbit|hare|lagomorpha/, '🐇'],
      [/horse|equus caballus/, '🐎'], [/cat|felis/, '🐈'], [/dog|canis lupus familiaris/, '🐕'],
      [/bird|aves/, '🐦'], [/fish|pisces/, '🐟'],
    ];
  const specificIcon = icons.find(([pattern]) => pattern.test(classification))?.[1];
  if (specificIcon) return specificIcon;
  if (category === 'Plants') return '🪴';
  const classIcons = {
    aves: '🐦', mammalia: '🐾', insecta: '🐞', arachnida: '🕷️', reptilia: '🦎', amphibia: '🐸',
    actinopterygii: '🐟', chondrichthyes: '🦈', malacostraca: '🦀', gastropoda: '🐚', cephalopoda: '🐙', cnidaria: '🪸',
  };
  return classIcons[(record.class || '').toLowerCase()] || '🐾';
}

async function fetchLiveDiscoveries(signal) {
  const groups = [
    { name: 'Animalia', rank: 'KINGDOM', category: 'Animals', maximum: 12 },
    { name: 'Aves', rank: 'CLASS', category: 'Birds', maximum: 16 },
    { name: 'Plantae', rank: 'KINGDOM', category: 'Plants', maximum: 12 },
  ];
  const results = await Promise.all(groups.map(async (group) => {
    try {
      const taxonResponse = await fetch(`${GBIF_API}/species/match?name=${group.name}&rank=${group.rank}&strict=true`, { signal });
      if (!taxonResponse.ok) throw new Error('Taxonomy lookup failed');
      const taxon = await taxonResponse.json();
      if (!taxon.usageKey) return [];

      const offset = Math.floor(Math.random() * 9000);
      const params = new URLSearchParams({
        taxonKey: String(taxon.usageKey), hasCoordinate: 'true', hasGeospatialIssue: 'false',
        mediaType: 'StillImage', limit: '100', offset: String(offset),
      });
      const occurrenceResponse = await fetch(`${GBIF_API}/occurrence/search?${params}`, { signal });
      if (!occurrenceResponse.ok) throw new Error('Occurrence lookup failed');
      const occurrenceData = await occurrenceResponse.json();
      const seen = new Set();
      return (occurrenceData.results || []).flatMap((record) => {
        const species = record.species || record.acceptedScientificName || record.scientificName;
        const speciesKey = record.speciesKey || species;
        if (group.category === 'Animals' && record.class === 'Aves') return [];
        if (!species || !Number.isFinite(record.decimalLatitude) || !Number.isFinite(record.decimalLongitude)) return [];
        if (Math.abs(record.decimalLatitude) > 90 || Math.abs(record.decimalLongitude) > 180) return [];
        if (record.coordinateUncertaintyInMeters > 100000) return [];

        // Blur precise coordinates to a broad, roughly one-degree map cell.
        const latitude = Math.round(record.decimalLatitude);
        const longitude = Math.round(record.decimalLongitude);
        const key = `${speciesKey}-${latitude}-${longitude}`;
        if (seen.has(key)) return [];
        seen.add(key);
        const coords = mapCoordinates(latitude, longitude);
        const name = record.vernacularName || species;
        const region = record.country || record.countryCode || 'the wild';
        const photo = (record.media || []).find((item) => {
          const license = item.license || '';
          return item.identifier?.startsWith('https://')
            && item.format?.toLowerCase().startsWith('image/')
            && /creativecommons\.org\/(licenses\/(by|by-sa)\/(3\.0|4\.0)|publicdomain\/zero\/1\.0)|\bcc0\b/i.test(license);
        });
        return [{
          id: `gbif-${group.category}-${key}`,
          name,
          vernacularName: record.vernacularName || '',
          scientificName: species,
          taxonKey: record.speciesKey || '',
          region,
          category: group.category,
          icon: getDiscoveryIcon(record, group.category),
          photo: photo ? {
            url: `https://api.gbif.org/v1/image/cache/180x/occurrence/${record.gbifID}/media/${md5Hex(photo.identifier)}`,
            creator: photo.creator || photo.rightsHolder || 'GBIF data publisher',
            license: photo.license,
          } : null,
          ...coords,
          latitude,
          longitude,
          fact: '',
          question: '',
          sourceLabel: 'GBIF wildlife record',
          sourceUrl: `https://www.gbif.org/occurrence/${record.gbifID}`,
          isLive: true,
        }];
      }).slice(0, group.maximum);
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      return [];
    }
  }));

  return results.flat();
}

async function fetchEnglishCommonName(taxonKey, signal) {
  if (!taxonKey) return '';
  const response = await fetch(`${GBIF_API}/species/${taxonKey}/vernacularNames?language=en`, { signal });
  if (!response.ok) return '';
  const names = await response.json();
  const getLanguage = (entry) => typeof entry.language === 'string'
    ? entry.language
    : entry.language?.language || entry.language?.iso6391 || entry.language?.code || '';
  const englishNames = names.filter((entry) => /^(en|eng|english)$/i.test(getLanguage(entry)));
  const preferred = (englishNames.length ? englishNames : names)
    .sort((left, right) => Number(Boolean(right.isPreferred)) - Number(Boolean(left.isPreferred)));
  return preferred[0]?.vernacularName || '';
}

async function fetchWikipediaSummary(title, scientificName, signal) {
  const query = `${title} ${scientificName || ''}`.trim();
  const params = new URLSearchParams({ action: 'query', list: 'search', srsearch: query, srlimit: '1', format: 'json', origin: '*' });
  const searchResponse = await fetch(`https://en.wikipedia.org/w/api.php?${params}`, { signal });
  if (!searchResponse.ok) throw new Error('Encyclopedia search failed');
  const searchData = await searchResponse.json();
  const pageTitle = searchData.query?.search?.[0]?.title;
  if (!pageTitle) return '';
  const summaryResponse = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle.replaceAll(' ', '_'))}`, { signal });
  if (!summaryResponse.ok) throw new Error('Encyclopedia summary failed');
  const summary = await summaryResponse.json();
  const extract = summary.extract || '';
  const shortExtract = extract.match(/^(.*?[.!?])(?:\s|$)/)?.[1] || extract.slice(0, 320);
  const childFriendlyExtract = /pronounced|phonetic|sometimes spelled|also known as|is a genus|taxonomic|family of|subfamily|order of/i.test(shortExtract) ? '' : shortExtract;
  const thumbnailUrl = summary.thumbnail?.source || '';
  const isCommonsImage = thumbnailUrl.includes('upload.wikimedia.org/wikipedia/commons/');
  const imagePath = isCommonsImage ? new URL(thumbnailUrl).pathname : '';
  const imageParts = imagePath.split('/');
  const thumbIndex = imageParts.indexOf('thumb');
  const commonsFileName = thumbIndex >= 0 ? imageParts[thumbIndex + 3] : imageParts[imageParts.length - 1];
  const commonsFileUrl = commonsFileName
    ? `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(decodeURIComponent(commonsFileName).replaceAll('_', ' '))}`
    : '';
  return { extract: childFriendlyExtract, title: pageTitle, thumbnail: isCommonsImage ? thumbnailUrl : '', commonsFileUrl };
}

function plainMetadataText(value) {
  return (value || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

async function fetchCommonsPhoto(query, signal) {
  const search = new URLSearchParams({
    action: 'query', list: 'search', srnamespace: '6', srlimit: '5', srsearch: query,
    format: 'json', origin: '*',
  });
  const searchResponse = await fetch(`https://commons.wikimedia.org/w/api.php?${search}`, { signal });
  if (!searchResponse.ok) return null;
  const searchData = await searchResponse.json();
  const candidates = searchData.query?.search || [];
  if (!candidates.length) return null;
  const params = new URLSearchParams({
    action: 'query', prop: 'imageinfo', titles: candidates.map((candidate) => candidate.title).join('|'),
    iiprop: 'url|extmetadata', iiurlwidth: '640',
    iiextmetadatafilter: 'LicenseShortName|LicenseUrl|Artist',
    format: 'json', origin: '*',
  });
  const imageResponse = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { signal });
  if (!imageResponse.ok) return null;
  const imageData = await imageResponse.json();
  const pagesByTitle = new Map(Object.values(imageData.query?.pages || {}).map((page) => [page.title, page]));
  for (const candidate of candidates) {
    const page = pagesByTitle.get(candidate.title);
    const info = page?.imageinfo?.[0];
    const metadata = info?.extmetadata || {};
    const licenseName = plainMetadataText(metadata.LicenseShortName?.value);
    const reusableLicense = /^(CC0|CC BY(-SA)? (2\.0|2\.5|3\.0|4\.0)|Public domain)/i.test(licenseName);
    if (!info?.thumburl || !reusableLicense) continue;
    const filePageUrl = `https://commons.wikimedia.org/wiki/${encodeURIComponent(candidate.title.replaceAll(' ', '_'))}`;
    return {
      url: info.thumburl,
      title: candidate.title.replace(/^File:/, ''),
      creator: plainMetadataText(metadata.Artist?.value) || 'Wikimedia Commons contributor',
      licenseName,
      licenseUrl: metadata.LicenseUrl?.value || filePageUrl,
      filePageUrl,
    };
  }
  return null;
}

export default function WorldExplorer({ language = 'english' }) {
  const [activeFilter, setActiveFilter] = useState('All places');
  const [selectedId, setSelectedId] = useState(null);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const panStart = useRef(null);
  const mapCanvasRef = useRef(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 1000, height: 500 });
  const [livePlaces, setLivePlaces] = useState([]);
  const [liveStatus, setLiveStatus] = useState('loading');
  const [liveSummary, setLiveSummary] = useState('');
  const [commonsPhoto, setCommonsPhoto] = useState(null);
  const [liveCommonName, setLiveCommonName] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreMessage, setMoreMessage] = useState('');
  const copy = mapCopy[language] || mapCopy.english;
  useEffect(() => {
    const controller = new AbortController();
    fetchLiveDiscoveries(controller.signal)
      .then((places) => {
        if (places.length) {
          setLivePlaces(places);
          setLiveStatus('ready');
        } else {
          setLiveStatus('unavailable');
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') setLiveStatus('unavailable');
      });
    return () => controller.abort();
  }, []);

  const allPlaces = useMemo(() => {
    if (!livePlaces.length) return worldPlaces;
    const liveCategories = new Set(livePlaces.map((place) => place.category));
    return [...worldPlaces.filter((place) => !liveCategories.has(place.category)), ...livePlaces];
  }, [livePlaces]);
  const displayPlaces = liveStatus === 'loading' && !livePlaces.length
    ? worldPlaces.filter((place) => !['Animals', 'Plants'].includes(place.category))
    : allPlaces;
  const places = useMemo(
    () => activeFilter === 'All places'
      ? displayPlaces
      : displayPlaces.filter((place) => place.category === activeFilter),
    [activeFilter, displayPlaces]
  );
  const laidOutPlaces = useMemo(() => {
    const { width, height } = mapDimensions;
    const spacing = 46;
    const points = places.map((place, index) => ({
      place,
      index,
      x: (place.x / 100) * width,
      y: (place.y / 100) * height,
      originalX: (place.x / 100) * width,
      originalY: (place.y / 100) * height,
    }));
    for (let iteration = 0; iteration < 100; iteration += 1) {
      let moved = false;
      for (let leftIndex = 0; leftIndex < points.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < points.length; rightIndex += 1) {
          const left = points[leftIndex];
          const right = points[rightIndex];
          let dx = right.x - left.x;
          let dy = right.y - left.y;
          let distance = Math.hypot(dx, dy);
          if (distance >= spacing) continue;
          if (distance < 0.01) {
            const angle = ((left.index * 37 + right.index * 71) % 360) * Math.PI / 180;
            dx = Math.cos(angle);
            dy = Math.sin(angle);
            distance = 1;
          }
          const push = (spacing - distance) * 0.52;
          const pushX = (dx / distance) * push;
          const pushY = (dy / distance) * push;
          left.x -= pushX;
          left.y -= pushY;
          right.x += pushX;
          right.y += pushY;
          moved = true;
        }
      }
      for (const point of points) {
        point.x += (point.originalX - point.x) * 0.008;
        point.y += (point.originalY - point.y) * 0.008;
        point.x = Math.max(28, Math.min(width - 28, point.x));
        point.y = Math.max(28, Math.min(height - 28, point.y));
      }
      if (!moved) break;
    }
    return points.map(({ place, x, y }) => ({ ...place, displayX: (x / width) * 100, displayY: (y / height) * 100 }));
  }, [places, mapDimensions]);
  const selectedPlace = displayPlaces.find((place) => place.id === selectedId);
  const selectedText = selectedPlace?.translations?.[language] || selectedPlace;
  const selectedName = selectedPlace?.isLive ? liveCommonName || selectedPlace.vernacularName || selectedText?.name : selectedText?.name;
  const detailImage = selectedPlace?.photo?.url || commonsPhoto?.url || liveSummary?.thumbnail || '';

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    if (!canvas || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) setMapDimensions({ width, height });
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  const beginMapPan = (event) => {
    if (event.target.closest('button, article, a')) return;
    panStart.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, pan: mapPan };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveMapPan = (event) => {
    if (!panStart.current || panStart.current.pointerId !== event.pointerId) return;
    setMapPan({
      x: panStart.current.pan.x + event.clientX - panStart.current.x,
      y: panStart.current.pan.y + event.clientY - panStart.current.y,
    });
  };
  const endMapPan = (event) => {
    if (panStart.current?.pointerId !== event.pointerId) return;
    panStart.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const resetMapView = () => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); };

  useEffect(() => {
    const unresolvedBirds = livePlaces.filter((place) => place.category === 'Birds' && !place.vernacularName && place.taxonKey);
    if (!unresolvedBirds.length) return undefined;
    const controller = new AbortController();
    Promise.all(unresolvedBirds.map(async (place) => ({
      id: place.id,
      name: await fetchEnglishCommonName(place.taxonKey, controller.signal).catch(() => ''),
    }))).then((resolved) => {
      if (controller.signal.aborted) return;
      setLivePlaces((current) => current.map((place) => {
        const name = resolved.find((entry) => entry.id === place.id)?.name;
        return name ? { ...place, name, vernacularName: name } : place;
      }));
    });
    return () => controller.abort();
  }, [livePlaces.length]);

  useEffect(() => {
    if (!selectedPlace) {
      setLiveSummary('');
      setCommonsPhoto(null);
      setLiveCommonName('');
      setSummaryLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    setLiveSummary('');
    setCommonsPhoto(null);
    setLiveCommonName(selectedPlace.vernacularName || '');
    setSummaryLoading(true);
    (async () => {
      const commonName = selectedPlace.isLive
        ? selectedPlace.vernacularName || await fetchEnglishCommonName(selectedPlace.taxonKey, controller.signal).catch(() => '')
        : selectedPlace.name;
      if (controller.signal.aborted) return;
      if (commonName) setLiveCommonName(commonName);
      const searchTitle = commonName || selectedPlace.name;
      const summaryPromise = fetchWikipediaSummary(searchTitle, selectedPlace.scientificName, controller.signal)
        .catch((error) => { if (error.name === 'AbortError') throw error; return ''; })
        .then((summary) => {
          if (!controller.signal.aborted) setLiveSummary(summary);
          return summary;
        });
      const imagePromise = selectedPlace.photo
        ? Promise.resolve(null)
        : fetchCommonsPhoto(`${searchTitle} ${selectedPlace.region}`, controller.signal)
          .catch((error) => { if (error.name === 'AbortError') throw error; return null; })
          .then((photo) => {
            if (!controller.signal.aborted) setCommonsPhoto(photo);
            return photo;
          });
      await Promise.all([summaryPromise, imagePromise]);
    })()
      .catch((error) => { if (error.name !== 'AbortError') setLiveSummary(''); })
      .finally(() => { if (!controller.signal.aborted) setSummaryLoading(false); });
    return () => controller.abort();
  }, [selectedPlace?.id, language]);

  const changeFilter = (filter) => {
    setActiveFilter(filter);
    setSelectedId(null);
  };

  const loadMoreDiscoveries = async () => {
    setLoadingMore(true);
    setMoreMessage('');
    try {
      const nextPlaces = await fetchLiveDiscoveries();
      const knownIds = new Set(livePlaces.map((place) => place.id));
      const newPlaces = nextPlaces.filter((place) => !knownIds.has(place.id));
      if (!newPlaces.length) setMoreMessage(copy.noMore);
      else setLivePlaces((current) => {
        const currentIds = new Set(current.map((place) => place.id));
        return [...current, ...newPlaces.filter((place) => !currentIds.has(place.id))];
      });
    } catch {
      setMoreMessage(copy.noMore);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section className="world-explorer" id="world-explorer" aria-labelledby="world-explorer-title" lang={language === 'hindi' ? 'hi' : language === 'hinglish' ? 'hi-Latn' : 'en'}>
      <div className="world-explorer-heading">
        <div>
          <span className="eyebrow">{copy.eyebrow}</span>
          <h2 id="world-explorer-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <div className="world-explorer-heading-tools">
          <span className="world-place-count">{copy.placeCount(allPlaces.length)}</span>
          <span className="world-explorer-icon" aria-hidden="true">🌍</span>
        </div>
      </div>

      <div className="world-filter-list" role="group" aria-label={copy.filtersLabel}>
        {worldPlaceFilters.map((filter) => (
          <button
            type="button"
            className={`world-filter${activeFilter === filter ? ' is-active' : ''}`}
            aria-pressed={activeFilter === filter}
            key={filter}
            onClick={() => changeFilter(filter)}
          >
            {copy.filters[filter]}
          </button>
        ))}
      </div>
      {liveStatus === 'ready' && (
        <div className="world-more-controls">
          <button type="button" className="world-filter world-more-button" onClick={loadMoreDiscoveries} disabled={loadingMore}>
            {loadingMore ? copy.loadingMore : copy.more}
          </button>
          {moreMessage && <span role="status">{moreMessage}</span>}
        </div>
      )}

      <div className="world-map-stage">
      <div ref={mapCanvasRef} className="world-map-canvas" onPointerDown={beginMapPan} onPointerMove={moveMapPan} onPointerUp={endMapPan} onPointerCancel={endMapPan}>
        <div className="world-map-scene" style={{ transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})` }}>
        <svg className="world-map-art" viewBox="0 0 1000 500" preserveAspectRatio="none" role="img" aria-labelledby="world-map-label">
          <title id="world-map-label">{copy.mapAlt}</title>
          <defs>
            <linearGradient id="world-ocean" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#dff5f5" />
              <stop offset="1" stopColor="#bee5eb" />
            </linearGradient>
          </defs>
          <rect width="1000" height="500" rx="32" fill="url(#world-ocean)" />
          <g className="world-map-grid" aria-hidden="true">
            <path d="M0 125 H1000 M0 250 H1000 M0 375 H1000" />
            <path d="M250 0 V500 M500 0 V500 M750 0 V500" />
            <ellipse cx="500" cy="250" rx="245" ry="250" />
            <ellipse cx="500" cy="250" rx="420" ry="250" />
          </g>
          <g className="world-map-land" aria-hidden="true">
            <path d="M72 92 116 63 164 58 188 75 223 72 253 95 280 111 294 139 274 159 250 164 238 187 211 194 203 218 180 220 165 244 144 236 137 214 119 200 104 177 87 168 78 143 61 129Z" />
            <path d="m254 64 22-30 31-5 22 20-7 33-26 15-23-10Z" />
            <path d="m253 232 25 10 18 26-3 34-12 32-9 41-19 39-12 43-18-23-4-36-13-28 5-34-8-31 17-31 10-29Z" />
            <path d="m414 117 22-26 28 2 18-13 34 6 18-9 42 8 34-8 34 14 28-4 36 18 29-1 25 18 31 6 24 24-9 20-34 3-23 15-36-3-24 17-29-8-18 19-24-7-10 27-27-3-20-18-20 1-11-21-23-4-19-20-22-2-12-17-23-8-25 9-12-13 16-22-19-18Z" />
            <path d="m470 219 34-10 37 8 22 22 17 37-10 37-20 39-7 40-22 18-18-25-5-37-19-20-5-39-18-19-4-30-18-17Z" />
            <path d="m790 316 34-13 40 10 23 24-10 25-26 17-36-6-31-17-12-22Z" />
            <path d="m800 206 18-8 18 7 4 16-17 9-20-7Z" />
            <path d="M140 458 Q250 431 355 449 T570 448 T790 454 T1000 447 V500 H0 V465Z" />
            <path d="m366 137 9-6 8 6-4 9-10-1Z m27 4 7-5 8 6-4 7-10-1Z m-9 18 6-3 6 5-4 6-8-2Z" />
          </g>
          <g className="world-map-labels" aria-hidden="true">
            <text x="145" y="153">{copy.continents[0]}</text>
            <text x="225" y="321" transform="rotate(76 225 321)">{copy.continents[1]}</text>
            <text x="520" y="265">{copy.continents[2]}</text>
            <text x="652" y="117">{copy.continents[3]}</text>
            <text x="825" y="365">{copy.continents[4]}</text>
            <text x="438" y="478">{copy.continents[5]}</text>
          </g>
        </svg>

        {laidOutPlaces.map((place) => {
          const translatedPlace = place.translations?.[language] || place;
          return (
            <button
              type="button"
              key={place.id}
              className={`world-map-marker${selectedId === place.id ? ' is-selected' : ''}`}
              style={{ left: `${place.displayX}%`, top: `${place.displayY}%` }}
              aria-label={copy.marker(place.isLive ? place.name : translatedPlace.name, translatedPlace.region)}
              aria-pressed={selectedId === place.id}
              onClick={() => setSelectedId(place.id)}
            >
              <span aria-hidden="true">{place.icon}</span>
              {place.photo && (place.category === 'Birds' || selectedId === place.id) && (
                <img src={place.photo.url} alt="" loading="lazy"
                  onLoad={(event) => event.currentTarget.parentElement.classList.add('has-photo')}
                  onError={(event) => { event.currentTarget.parentElement.classList.remove('has-photo'); event.currentTarget.remove(); }} />
              )}
              {(place.category === 'Birds' || selectedId === place.id) && (
                <span className={`world-map-marker-label${place.x > 70 ? ' label-left' : ''}`}>{place.isLive ? place.name : translatedPlace.name}</span>
              )}
            </button>
          );
        })}
        </div>
        <div className="world-map-zoom" role="group" aria-label={copy.zoomLabel}>
          <button type="button" aria-label={copy.zoomIn} onClick={() => setMapZoom((zoom) => Math.min(3, Number((zoom + 0.5).toFixed(1))))} disabled={mapZoom >= 3}>+</button>
          <button type="button" aria-label={copy.zoomOut} onClick={() => setMapZoom((zoom) => Math.max(1, Number((zoom - 0.5).toFixed(1))))} disabled={mapZoom <= 1}>−</button>
          {(mapZoom > 1 || mapPan.x !== 0 || mapPan.y !== 0) && <button type="button" aria-label={copy.resetZoom} onClick={resetMapView}>↺</button>}
        </div>
        <span className="world-map-pan-hint">{copy.panHint}</span>
      </div>
        {selectedPlace && selectedText && (
          <article className="world-place-card world-place-panel" aria-live="polite" aria-labelledby="world-place-title">
            <button type="button" className="world-place-close" aria-label={copy.closeDetails} onClick={() => setSelectedId(null)}>×</button>
            <div className="world-place-panel-heading">
              <div>
                <span className="world-place-category">{selectedText.category}</span>
                <h3 id="world-place-title">{selectedName}</h3>
                {selectedPlace.isLive && selectedPlace.scientificName && selectedPlace.scientificName !== selectedName && (
                  <p className="world-place-scientific"><i>{selectedPlace.scientificName}</i></p>
                )}
                <p className="world-place-region">{selectedText.region}</p>
              </div>
              <div className="world-place-emoji" aria-hidden="true">
                {selectedPlace.icon}
                {selectedPlace.photo && <img src={selectedPlace.photo.url} alt="" onError={(event) => event.currentTarget.remove()} />}
              </div>
            </div>
            {detailImage && (
              <figure className="world-place-photo">
                <img src={detailImage} alt={selectedName} fetchPriority="high" onError={(event) => event.currentTarget.closest('figure').remove()} />
                <figcaption>
                  {selectedPlace.photo
                    ? <>{copy.photoCredit(selectedPlace.photo.creator)} · <a href={selectedPlace.photo.license} target="_blank" rel="noreferrer">{copy.imageLicense} ↗</a></>
                    : commonsPhoto
                      ? <>{copy.photoCredit(commonsPhoto.creator)} · <a href={commonsPhoto.licenseUrl} target="_blank" rel="noreferrer">{commonsPhoto.licenseName} ↗</a></>
                      : <><a href={commonsPhoto?.filePageUrl || liveSummary?.commonsFileUrl} target="_blank" rel="noreferrer">{copy.commonsCredit} ↗</a></>}
                </figcaption>
              </figure>
            )}
            {!detailImage && <div className="world-place-photo-placeholder" role={summaryLoading ? 'status' : undefined}>
              <span aria-hidden="true">{summaryLoading ? '🔎' : '🖼️'}</span>
              {summaryLoading ? copy.imageLoading : copy.imageUnavailable}
            </div>}
            <h4>{selectedPlace.isLive ? copy.observedHere : copy.exploreHere}</h4>
            <p>{selectedPlace.isLive
              ? liveSummary?.extract || (summaryLoading ? copy.summaryLoading : copy.liveFact(selectedName, selectedText.region))
              : selectedText.fact}</p>
            <p className="world-place-question">{copy.wonder}: {selectedPlace.isLive
              ? copy.liveQuestion
              : selectedText.question}</p>
            <div className="world-place-sources">
              <a href={selectedPlace.sourceUrl} target="_blank" rel="noreferrer">
                {copy.source}: {selectedPlace.sourceLabel} ↗
              </a>
              {selectedPlace.isLive && liveSummary?.title && (
                <a href={`https://en.wikipedia.org/wiki/${encodeURIComponent(liveSummary.title.replaceAll(' ', '_'))}`} target="_blank" rel="noreferrer">
                  {copy.wikipediaSource} (CC BY-SA) ↗
                </a>
              )}
            </div>
          </article>
        )}
      </div>

      <p className="world-map-note">{liveStatus === 'ready' ? copy.liveNote : copy.note}</p>
      {liveStatus === 'loading' && <p className="world-live-status" role="status">{copy.loading}</p>}
      {liveStatus === 'unavailable' && <p className="world-live-status" role="status">{copy.liveUnavailable}</p>}

      {!selectedPlace && <div className="world-place-empty" aria-live="polite"><span aria-hidden="true">👆</span><p>{copy.empty}</p></div>}
    </section>
  );
}
