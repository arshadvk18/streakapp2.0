import { QuranWord } from './quran-word.model';

export const QURAN_WORDS: QuranWord[] = [
  {
    id: 1, word: 'رَحْمَة', transliteration: 'Rahmah', root: 'ر ح م',
    meaning: 'Mercy', frequency: 339,
    forms: [
      { word: 'رَحِيم', meaning: 'Most Merciful' },
      { word: 'رَحْمَٰن', meaning: 'Most Gracious' },
      { word: 'أَرْحَم', meaning: 'Most merciful of' },
      { word: 'تَرْحَمُ', meaning: 'You have mercy' },
    ],
    occurrences: [
      { surah: 2, ayah: 218, text: 'أُولَٰئِكَ يَرْجُونَ رَحْمَتَ اللَّهِ' },
      { surah: 6, ayah: 12, text: 'كَتَبَ عَلَىٰ نَفْسِهِ الرَّحْمَةَ' },
      { surah: 7, ayah: 156, text: 'وَرَحْمَتِي وَسِعَتْ كُلَّ شَيْءٍ' },
      { surah: 21, ayah: 107, text: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ' },
    ]
  },
  {
    id: 2, word: 'عِلْم', transliteration: "'Ilm", root: 'ع ل م',
    meaning: 'Knowledge', frequency: 854,
    forms: [
      { word: 'عَلِيم', meaning: 'All-Knowing' },
      { word: 'عَالِم', meaning: 'Knower' },
      { word: 'يَعْلَمُ', meaning: 'He knows' },
      { word: 'عُلَمَاء', meaning: 'Scholars' },
    ],
    occurrences: [
      { surah: 2, ayah: 32, text: 'لَا عِلْمَ لَنَا إِلَّا مَا عَلَّمْتَنَا' },
      { surah: 20, ayah: 114, text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا' },
      { surah: 58, ayah: 11, text: 'يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ' },
    ]
  },
  {
    id: 3, word: 'صَبْر', transliteration: 'Sabr', root: 'ص ب ر',
    meaning: 'Patience', frequency: 103,
    forms: [
      { word: 'صَابِر', meaning: 'Patient one' },
      { word: 'صَابِرِين', meaning: 'The patient ones' },
      { word: 'اصْبِرْ', meaning: 'Be patient' },
    ],
    occurrences: [
      { surah: 2, ayah: 153, text: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ' },
      { surah: 3, ayah: 200, text: 'اصْبِرُوا وَصَابِرُوا وَرَابِطُوا' },
      { surah: 16, ayah: 127, text: 'وَاصْبِرْ وَمَا صَبْرُكَ إِلَّا بِاللَّهِ' },
    ]
  },
  {
    id: 4, word: 'تَقْوَى', transliteration: 'Taqwa', root: 'و ق ي',
    meaning: 'God-consciousness / Piety', frequency: 258,
    forms: [
      { word: 'مُتَّقِين', meaning: 'The God-conscious' },
      { word: 'اتَّقُوا', meaning: 'Fear (Allah)' },
      { word: 'يَتَّقِ', meaning: 'He fears (Allah)' },
    ],
    occurrences: [
      { surah: 2, ayah: 2, text: 'هُدًى لِّلْمُتَّقِينَ' },
      { surah: 2, ayah: 197, text: 'وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ' },
      { surah: 49, ayah: 13, text: 'إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ' },
    ]
  },
  {
    id: 5, word: 'هُدَى', transliteration: 'Huda', root: 'ه د ي',
    meaning: 'Guidance', frequency: 316,
    forms: [
      { word: 'هَادِ', meaning: 'Guide' },
      { word: 'يَهْدِي', meaning: 'He guides' },
      { word: 'اهْدِنَا', meaning: 'Guide us' },
      { word: 'مُهْتَدِ', meaning: 'Rightly guided' },
    ],
    occurrences: [
      { surah: 1, ayah: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ' },
      { surah: 2, ayah: 2, text: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ' },
      { surah: 6, ayah: 71, text: 'إِنَّ هُدَى اللَّهِ هُوَ الْهُدَىٰ' },
    ]
  },
  {
    id: 6, word: 'نُور', transliteration: 'Noor', root: 'ن و ر',
    meaning: 'Light', frequency: 194,
    forms: [
      { word: 'أَنَارَ', meaning: 'He illuminated' },
      { word: 'مُنِير', meaning: 'Illuminating' },
      { word: 'نُورًا', meaning: 'A light' },
    ],
    occurrences: [
      { surah: 24, ayah: 35, text: 'اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ' },
      { surah: 5, ayah: 15, text: 'قَدْ جَاءَكُم مِّنَ اللَّهِ نُورٌ وَكِتَابٌ مُّبِينٌ' },
      { surah: 57, ayah: 12, text: 'يَسْعَىٰ نُورُهُم بَيْنَ أَيْدِيهِمْ' },
    ]
  },
  {
    id: 7, word: 'إِيمَان', transliteration: 'Iman', root: 'أ م ن',
    meaning: 'Faith / Belief', frequency: 811,
    forms: [
      { word: 'مُؤْمِن', meaning: 'Believer' },
      { word: 'مُؤْمِنُون', meaning: 'The believers' },
      { word: 'آمَنُوا', meaning: 'They believed' },
      { word: 'أَمَانَة', meaning: 'Trust' },
    ],
    occurrences: [
      { surah: 2, ayah: 285, text: 'آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ' },
      { surah: 49, ayah: 7, text: 'وَلَٰكِنَّ اللَّهَ حَبَّبَ إِلَيْكُمُ الْإِيمَانَ' },
    ]
  },
  {
    id: 8, word: 'تَوْبَة', transliteration: 'Tawbah', root: 'ت و ب',
    meaning: 'Repentance', frequency: 87,
    forms: [
      { word: 'تَائِب', meaning: 'Repentant' },
      { word: 'تَوَّاب', meaning: 'Oft-Returning (in mercy)' },
      { word: 'تُوبُوا', meaning: 'Repent' },
    ],
    occurrences: [
      { surah: 66, ayah: 8, text: 'تُوبُوا إِلَى اللَّهِ تَوْبَةً نَّصُوحًا' },
      { surah: 4, ayah: 17, text: 'إِنَّمَا التَّوْبَةُ عَلَى اللَّهِ' },
      { surah: 25, ayah: 71, text: 'وَمَن تَابَ وَعَمِلَ صَالِحًا' },
    ]
  },
  {
    id: 9, word: 'شُكْر', transliteration: 'Shukr', root: 'ش ك ر',
    meaning: 'Gratitude / Thanks', frequency: 75,
    forms: [
      { word: 'شَكُور', meaning: 'Most Grateful' },
      { word: 'شَاكِر', meaning: 'Grateful one' },
      { word: 'اشْكُرُوا', meaning: 'Be grateful' },
    ],
    occurrences: [
      { surah: 2, ayah: 152, text: 'فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي' },
      { surah: 14, ayah: 7, text: 'لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ' },
      { surah: 31, ayah: 12, text: 'أَنِ اشْكُرْ لِلَّهِ' },
    ]
  },
  {
    id: 10, word: 'ذِكْر', transliteration: 'Dhikr', root: 'ذ ك ر',
    meaning: 'Remembrance', frequency: 292,
    forms: [
      { word: 'يَذْكُرُ', meaning: 'He remembers' },
      { word: 'اذْكُرُوا', meaning: 'Remember' },
      { word: 'تَذْكِرَة', meaning: 'Reminder' },
    ],
    occurrences: [
      { surah: 13, ayah: 28, text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ' },
      { surah: 2, ayah: 152, text: 'فَاذْكُرُونِي أَذْكُرْكُمْ' },
      { surah: 33, ayah: 41, text: 'اذْكُرُوا اللَّهَ ذِكْرًا كَثِيرًا' },
    ]
  },
  {
    id: 11, word: 'دُعَاء', transliteration: "Du'a", root: 'د ع و',
    meaning: 'Supplication / Prayer', frequency: 212,
    forms: [
      { word: 'يَدْعُو', meaning: 'He calls / supplicates' },
      { word: 'ادْعُ', meaning: 'Call upon / Supplicate' },
      { word: 'دَاعِ', meaning: 'Caller' },
    ],
    occurrences: [
      { surah: 2, ayah: 186, text: 'أُجِيبُ دَعْوَةَ الدَّاعِ إِذَا دَعَانِ' },
      { surah: 40, ayah: 60, text: 'ادْعُونِي أَسْتَجِبْ لَكُمْ' },
    ]
  },
  {
    id: 12, word: 'جَنَّة', transliteration: 'Jannah', root: 'ج ن ن',
    meaning: 'Paradise / Garden', frequency: 147,
    forms: [
      { word: 'جَنَّات', meaning: 'Gardens' },
      { word: 'جِنّ', meaning: 'Jinn (hidden beings)' },
    ],
    occurrences: [
      { surah: 2, ayah: 25, text: 'أَنَّ لَهُمْ جَنَّاتٍ تَجْرِي مِن تَحْتِهَا الْأَنْهَارُ' },
      { surah: 55, ayah: 46, text: 'وَلِمَنْ خَافَ مَقَامَ رَبِّهِ جَنَّتَانِ' },
    ]
  },
  {
    id: 13, word: 'صَلَاة', transliteration: 'Salah', root: 'ص ل و',
    meaning: 'Prayer / Worship', frequency: 99,
    forms: [
      { word: 'صَلُّوا', meaning: 'Pray (command)' },
      { word: 'يُصَلِّي', meaning: 'He prays' },
      { word: 'مُصَلِّين', meaning: 'Those who pray' },
    ],
    occurrences: [
      { surah: 2, ayah: 3, text: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ' },
      { surah: 29, ayah: 45, text: 'إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ' },
    ]
  },
  {
    id: 14, word: 'قَلْب', transliteration: 'Qalb', root: 'ق ل ب',
    meaning: 'Heart', frequency: 168,
    forms: [
      { word: 'قُلُوب', meaning: 'Hearts' },
      { word: 'يَنقَلِبُ', meaning: 'He turns / returns' },
      { word: 'تَقَلُّب', meaning: 'Turning / fluctuation' },
    ],
    occurrences: [
      { surah: 13, ayah: 28, text: 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ' },
      { surah: 22, ayah: 46, text: 'فَإِنَّهَا لَا تَعْمَى الْأَبْصَارُ وَلَٰكِن تَعْمَى الْقُلُوبُ' },
    ]
  },
  {
    id: 15, word: 'حَقّ', transliteration: 'Haqq', root: 'ح ق ق',
    meaning: 'Truth / Right', frequency: 287,
    forms: [
      { word: 'حَقِيقَة', meaning: 'Reality' },
      { word: 'أَحَقُّ', meaning: 'More deserving' },
      { word: 'يُحِقُّ', meaning: 'He establishes truth' },
    ],
    occurrences: [
      { surah: 2, ayah: 42, text: 'وَلَا تَلْبِسُوا الْحَقَّ بِالْبَاطِلِ' },
      { surah: 10, ayah: 32, text: 'فَذَٰلِكُمُ اللَّهُ رَبُّكُمُ الْحَقُّ' },
      { surah: 17, ayah: 81, text: 'جَاءَ الْحَقُّ وَزَهَقَ الْبَاطِلُ' },
    ]
  },
  {
    id: 16, word: 'عَدْل', transliteration: "'Adl", root: 'ع د ل',
    meaning: 'Justice / Fairness', frequency: 28,
    forms: [
      { word: 'عَادِل', meaning: 'Just person' },
      { word: 'اعْدِلُوا', meaning: 'Be just' },
    ],
    occurrences: [
      { surah: 5, ayah: 8, text: 'اعْدِلُوا هُوَ أَقْرَبُ لِلتَّقْوَىٰ' },
      { surah: 16, ayah: 90, text: 'إِنَّ اللَّهَ يَأْمُرُ بِالْعَدْلِ وَالْإِحْسَانِ' },
    ]
  },
  {
    id: 17, word: 'سَلَام', transliteration: 'Salam', root: 'س ل م',
    meaning: 'Peace', frequency: 140,
    forms: [
      { word: 'إِسْلَام', meaning: 'Submission (to God)' },
      { word: 'مُسْلِم', meaning: 'One who submits' },
      { word: 'سَلِيم', meaning: 'Sound / Wholesome' },
    ],
    occurrences: [
      { surah: 6, ayah: 54, text: 'فَقُلْ سَلَامٌ عَلَيْكُمْ' },
      { surah: 36, ayah: 58, text: 'سَلَامٌ قَوْلًا مِّن رَّبٍّ رَّحِيمٍ' },
      { surah: 97, ayah: 5, text: 'سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ' },
    ]
  },
  {
    id: 18, word: 'خَيْر', transliteration: 'Khayr', root: 'خ ي ر',
    meaning: 'Good / Goodness', frequency: 188,
    forms: [
      { word: 'خَيْرَات', meaning: 'Good things' },
      { word: 'خِيَار', meaning: 'Best / Chosen' },
    ],
    occurrences: [
      { surah: 2, ayah: 110, text: 'وَمَا تُقَدِّمُوا لِأَنفُسِكُم مِّنْ خَيْرٍ تَجِدُوهُ عِندَ اللَّهِ' },
      { surah: 3, ayah: 110, text: 'كُنتُمْ خَيْرَ أُمَّةٍ أُخْرِجَتْ لِلنَّاسِ' },
    ]
  },
  {
    id: 19, word: 'أَمَانَة', transliteration: 'Amanah', root: 'أ م ن',
    meaning: 'Trust / Trustworthiness', frequency: 18,
    forms: [
      { word: 'أَمِين', meaning: 'Trustworthy' },
      { word: 'أَمَّنَ', meaning: 'He entrusted' },
    ],
    occurrences: [
      { surah: 33, ayah: 72, text: 'إِنَّا عَرَضْنَا الْأَمَانَةَ عَلَى السَّمَاوَاتِ' },
      { surah: 8, ayah: 27, text: 'لَا تَخُونُوا اللَّهَ وَالرَّسُولَ وَتَخُونُوا أَمَانَاتِكُمْ' },
    ]
  },
  {
    id: 20, word: 'بَرَكَة', transliteration: 'Barakah', root: 'ب ر ك',
    meaning: 'Blessing', frequency: 32,
    forms: [
      { word: 'مُبَارَك', meaning: 'Blessed' },
      { word: 'تَبَارَكَ', meaning: 'Blessed is (He)' },
    ],
    occurrences: [
      { surah: 7, ayah: 96, text: 'لَفَتَحْنَا عَلَيْهِم بَرَكَاتٍ مِّنَ السَّمَاءِ' },
      { surah: 25, ayah: 1, text: 'تَبَارَكَ الَّذِي نَزَّلَ الْفُرْقَانَ' },
    ]
  },
  {
    id: 21, word: 'رِزْق', transliteration: 'Rizq', root: 'ر ز ق',
    meaning: 'Provision / Sustenance', frequency: 123,
    forms: [
      { word: 'رَازِق', meaning: 'Provider' },
      { word: 'رَزَقْنَا', meaning: 'We have provided' },
      { word: 'يَرْزُقُ', meaning: 'He provides' },
    ],
    occurrences: [
      { surah: 2, ayah: 3, text: 'وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ' },
      { surah: 65, ayah: 3, text: 'وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ' },
    ]
  },
  {
    id: 22, word: 'عِبَادَة', transliteration: "'Ibadah", root: 'ع ب د',
    meaning: 'Worship', frequency: 275,
    forms: [
      { word: 'عَبْد', meaning: 'Servant / Slave' },
      { word: 'عِبَاد', meaning: 'Servants' },
      { word: 'اعْبُدُوا', meaning: 'Worship (command)' },
    ],
    occurrences: [
      { surah: 51, ayah: 56, text: 'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ' },
      { surah: 1, ayah: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    ]
  },
  {
    id: 23, word: 'حِكْمَة', transliteration: 'Hikmah', root: 'ح ك م',
    meaning: 'Wisdom', frequency: 210,
    forms: [
      { word: 'حَكِيم', meaning: 'Wise' },
      { word: 'حُكْم', meaning: 'Judgment / Rule' },
      { word: 'حَاكِم', meaning: 'Judge / Ruler' },
    ],
    occurrences: [
      { surah: 2, ayah: 269, text: 'يُؤْتِي الْحِكْمَةَ مَن يَشَاءُ' },
      { surah: 31, ayah: 12, text: 'وَلَقَدْ آتَيْنَا لُقْمَانَ الْحِكْمَةَ' },
    ]
  },
  {
    id: 24, word: 'يَقِين', transliteration: 'Yaqeen', root: 'ي ق ن',
    meaning: 'Certainty / Conviction', frequency: 28,
    forms: [
      { word: 'مُوقِنِين', meaning: 'Those who are certain' },
      { word: 'أَيْقَنَ', meaning: 'He became certain' },
    ],
    occurrences: [
      { surah: 2, ayah: 4, text: 'وَبِالْآخِرَةِ هُمْ يُوقِنُونَ' },
      { surah: 15, ayah: 99, text: 'وَاعْبُدْ رَبَّكَ حَتَّىٰ يَأْتِيَكَ الْيَقِينُ' },
    ]
  },
  {
    id: 25, word: 'تَوَكُّل', transliteration: 'Tawakkul', root: 'و ك ل',
    meaning: 'Trust in Allah / Reliance', frequency: 70,
    forms: [
      { word: 'مُتَوَكِّل', meaning: 'One who relies on Allah' },
      { word: 'وَكِيل', meaning: 'Trustee / Disposer (of affairs)' },
      { word: 'تَوَكَّلْ', meaning: 'Place your trust' },
    ],
    occurrences: [
      { surah: 3, ayah: 159, text: 'فَإِذَا عَزَمْتَ فَتَوَكَّلْ عَلَى اللَّهِ' },
      { surah: 65, ayah: 3, text: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ' },
    ]
  },
  {
    id: 26, word: 'فِتْنَة', transliteration: 'Fitnah', root: 'ف ت ن',
    meaning: 'Trial / Temptation', frequency: 60,
    forms: [
      { word: 'فُتِنَ', meaning: 'He was tested' },
      { word: 'يَفْتِنُ', meaning: 'He tempts / tests' },
    ],
    occurrences: [
      { surah: 2, ayah: 191, text: 'وَالْفِتْنَةُ أَشَدُّ مِنَ الْقَتْلِ' },
      { surah: 29, ayah: 2, text: 'أَحَسِبَ النَّاسُ أَن يُتْرَكُوا أَن يَقُولُوا آمَنَّا وَهُمْ لَا يُفْتَنُونَ' },
    ]
  },
  {
    id: 27, word: 'مَغْفِرَة', transliteration: 'Maghfirah', root: 'غ ف ر',
    meaning: 'Forgiveness', frequency: 234,
    forms: [
      { word: 'غَفُور', meaning: 'Most Forgiving' },
      { word: 'اسْتَغْفِرْ', meaning: 'Seek forgiveness' },
      { word: 'غُفْرَان', meaning: 'Pardon' },
    ],
    occurrences: [
      { surah: 2, ayah: 286, text: 'وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا' },
      { surah: 3, ayah: 133, text: 'وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ وَجَنَّةٍ' },
    ]
  },
  {
    id: 28, word: 'أَجْر', transliteration: 'Ajr', root: 'أ ج ر',
    meaning: 'Reward', frequency: 105,
    forms: [
      { word: 'أُجُور', meaning: 'Rewards' },
      { word: 'يَأْجُرُ', meaning: 'He rewards' },
    ],
    occurrences: [
      { surah: 3, ayah: 136, text: 'وَنِعْمَ أَجْرُ الْعَامِلِينَ' },
      { surah: 39, ayah: 10, text: 'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُم بِغَيْرِ حِسَابٍ' },
    ]
  },
  {
    id: 29, word: 'خَشْيَة', transliteration: 'Khashyah', root: 'خ ش ي',
    meaning: 'Awe / Reverent Fear', frequency: 48,
    forms: [
      { word: 'خَاشِع', meaning: 'Humble / In awe' },
      { word: 'يَخْشَى', meaning: 'He fears (reverently)' },
      { word: 'خُشُوع', meaning: 'Humility in worship' },
    ],
    occurrences: [
      { surah: 35, ayah: 28, text: 'إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ' },
      { surah: 23, ayah: 2, text: 'الَّذِينَ هُمْ فِي صَلَاتِهِمْ خَاشِعُونَ' },
    ]
  },
  {
    id: 30, word: 'آيَة', transliteration: 'Ayah', root: 'أ ي ي',
    meaning: 'Sign / Verse', frequency: 382,
    forms: [
      { word: 'آيَات', meaning: 'Signs / Verses' },
    ],
    occurrences: [
      { surah: 2, ayah: 164, text: 'إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ... لَآيَاتٍ' },
      { surah: 41, ayah: 53, text: 'سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ' },
    ]
  },
];

/** Total frequency across the entire Qur'an (~77,430 unique word positions) */
export const TOTAL_QURAN_WORD_FREQUENCY = 77430;
