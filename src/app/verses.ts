/**
 * Quranic Verses (Ayahs) Collection
 * Curated verses for daily inspiration and spiritual reflection
 */

export interface AyahOfDay {
  arabic: string;
  transliteration: string;
  translation: string;
  surah: string;
  ayah: number;
  surahNumber: number;
}

export const QuranicVerses: AyahOfDay[] = [
  {
    arabic: 'وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا',
    transliteration: 'Wa allazeena jahadoo feena la nahdiyannahu subulana',
    translation: 'And those who strive for Us – We will surely guide them to Our ways.',
    surah: 'Al-Ankabut',
    ayah: 69,
    surahNumber: 29
  },
  {
    arabic: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    transliteration: 'Fa inna ma\'a al-\'usri yusra, inna ma\'a al-\'usri yusra',
    translation: 'Indeed, with hardship comes ease. Indeed, with hardship comes ease.',
    surah: 'Al-Inshirah',
    ayah: 5,
    surahNumber: 94
  },
  {
    arabic: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ',
    transliteration: 'Fadhkuruni adhkurkum, waashkuruli wa la takfurun',
    translation: 'So remember Me; I will remember you. And be grateful to Me and do not deny Me.',
    surah: 'Al-Baqarah',
    ayah: 152,
    surahNumber: 2
  },
  {
    arabic: 'لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا',
    transliteration: 'La yukallif Allahu nafsan illa wus\'aha',
    translation: 'Allah does not burden a soul beyond that it can bear.',
    surah: 'Al-Baqarah',
    ayah: 286,
    surahNumber: 2
  },
  {
    arabic: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ',
    transliteration: 'Inna salata tanha \'an al-faha wa al-munkar',
    translation: 'Indeed, the prayer prevents immorality and wrongdoing.',
    surah: 'Al-Ankabut',
    ayah: 45,
    surahNumber: 29
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    transliteration: 'Wa man yatawakkal \'ala Allah fahuwa hasbuh',
    translation: 'And whoever puts their trust in Allah, then He alone is sufficient for them.',
    surah: 'At-Talaq',
    ayah: 3,
    surahNumber: 65
  },
  {
    arabic: 'لَا تَيْأَسُوا مِن رَّحْمَةِ اللَّهِ ۚ إِنَّ اللَّهَ يَغْفِرُ الذُّنُوبَ جَمِيعًا',
    transliteration: 'La tayasu min rahmat Allah. Inna Allah yaghfiru adh-dhunub jami\'a',
    translation: 'Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.',
    surah: 'Az-Zumar',
    ayah: 53,
    surahNumber: 39
  },
  {
    arabic: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ',
    transliteration: 'Ala bidhikr Allah tatmain al-qulub',
    translation: 'Verily, in the remembrance of Allah do hearts find rest.',
    surah: 'Ar-Ra\'d',
    ayah: 28,
    surahNumber: 13
  },
  {
    arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
    transliteration: 'Wa man yattaqʿ Allah yajʿal lahu makhrajā',
    translation: 'And whoever fears Allah – He will make a way out for him.',
    surah: 'At-Talaq',
    ayah: 2,
    surahNumber: 65
  },
  {
    arabic: 'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ',
    transliteration: 'Wa laqad yassarna al-Quran li adh-dhikr fa hal min muddakir',
    translation: 'And We have certainly made the Quran easy for remembrance, so is there any who will remember?',
    surah: 'Al-Qamar',
    ayah: 17,
    surahNumber: 54
  },
  {
    arabic: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ',
    transliteration: 'La in shakartum la azidanna kum',
    translation: 'If you are grateful, I will certainly give you more.',
    surah: 'Ibrahim',
    ayah: 7,
    surahNumber: 14
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ ۚ إِنَّ اللَّهَ بَالِغُ أَمْرِهِ',
    transliteration: 'Wa man yatawakkal \'ala Allah fahuwa hasbuh. Inna Allah baligh amrih',
    translation: 'And whoever relies upon Allah, then He is sufficient for him. Indeed, Allah will accomplish His purpose.',
    surah: 'At-Talaq',
    ayah: 3,
    surahNumber: 65
  },
  {
    arabic: 'قُلْ إِنَّ صَلَاتِي وَنُسُكِي وَمَحْيَايَ وَمَمَاتِي لِلَّهِ رَبِّ الْعَالَمِينَ',
    transliteration: 'Qul inna salati wa nusuki wa mahyaya wa mamatī lilah rabb al-\'alamin',
    translation: 'Say, "Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds."',
    surah: 'Al-An\'am',
    ayah: 162,
    surahNumber: 6
  },
  {
    arabic: 'أَمْ حَسِبَ الَّذِينَ اجْتَرَحُوا السَّيِّئَاتِ أَن نَّجْعَلَهُمْ كَالَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ',
    transliteration: 'Am hasiba allazeena ijtarahu as-sayyiat an najʿalahum ka allazeena amanu wa amilū as-salihat',
    translation: 'Do people think they will be left alone because they say, "We believe," and will not be tested?',
    surah: 'Al-Ankabut',
    ayah: 2,
    surahNumber: 29
  },
  {
    arabic: 'ادْعُونِي أَسْتَجِبْ لَكُمْ',
    transliteration: 'Ud\'uni astajih lakum',
    translation: 'Call upon Me; I will respond to you.',
    surah: 'Ghafir',
    ayah: 60,
    surahNumber: 40
  },
  {
    arabic: 'سَيَجْعَلُ اللَّهُ بَعْدَ عُسْرٍ يُسْرًا',
    transliteration: 'Sayajʿalu Allah baʿda \'usrin yusra',
    translation: 'Allah will bring ease after difficulty.',
    surah: 'At-Talaq',
    ayah: 7,
    surahNumber: 65
  },
  {
    arabic: 'وَاللَّهُ غَفُورٌ رَّحِيمٌ',
    transliteration: 'Wa Allahu ghafur raheem',
    translation: 'And Allah is Forgiving and Merciful.',
    surah: 'At-Tabah (various)',
    ayah: 0,
    surahNumber: 0
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    transliteration: 'Inna Allah maʿa as-sabirin',
    translation: 'Indeed, Allah is with the patient ones.',
    surah: 'Al-Baqarah',
    ayah: 153,
    surahNumber: 2
  },
  {
    arabic: 'فَاصْبِرْ صَبْرًا جَمِيلًا',
    transliteration: 'Fasabir sabran jamila',
    translation: 'So be patient with a beautiful patience.',
    surah: 'Al-Ma\'arij',
    ayah: 5,
    surahNumber: 70
  },
  {
    arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ',
    transliteration: 'Wa \'asa an takrahu shayan wa huwa khair lakum',
    translation: 'Perhaps you hate a thing and it is good for you.',
    surah: 'Al-Baqarah',
    ayah: 216,
    surahNumber: 2
  }
];

/**
 * Get Ayah of the Day based on date
 * This ensures the same Ayah is shown throughout the day regardless of timezone
 */
export function getAyahOfDay(): AyahOfDay {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QuranicVerses[dayOfYear % QuranicVerses.length];
}

/**
 * Get random Ayah
 */
export function getRandomAyah(): AyahOfDay {
  return QuranicVerses[Math.floor(Math.random() * QuranicVerses.length)];
}
