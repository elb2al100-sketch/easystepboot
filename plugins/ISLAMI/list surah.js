async function handle(sock, messageInfo) {
    const { remoteJid, message} = messageInfo;

    const surah = `_*سور القرآن الكريم-Surahs of the Quran*_

1. Al Fatihah (الفاتحه): 7 Ayat

2. Al Baqarah (البقرة): 286 Ayat

3. Ali Imran (آل عمرا): 200 Ayat

4. An Nisa (النساء): 176 Ayat

5. Al Ma'idah (المائدة): 120 Ayat

6. Al An'am (الانعام): 165 Ayat

7. Al-A'raf (الاعراف): 206 Ayat

8. Al-Anfal (الانفال): 75 Ayat

9. At-Taubah (التوبة): 129 Ayat

10. Yunus (يونس): 109 Ayat

11. Hud (هود): 123 Ayat

12. Yusuf (يوسف): 111 Ayat

13. Ar-Ra'd (الرعد): 43 Ayat

14. Ibrahim (ابراهيم): 52 Ayat

15. Al-Hijr (الحجر): 99 Ayat

16. An-Nahl (النحل): 128 Ayat

17. Al-Isra' (الاسراء): 111 Ayat

18. Al-Kahf (الكهف): 110 Ayat

19. Maryam (مريم): 98 Ayat

20. Ta Ha (طه): 135 Ayat

21. Al-Anbiya (الانبياء): 112 Ayat

22. Al-Hajj (الحج): 78 Ayat

23. Al-Mu'minun (المؤمنون): 118 Ayat

24. An-Nur (النور): 64 Ayat

25. Al-Furqan (الفرقان): 77 Ayat

26. Asy-Syu'ara' (الشعراء): 227 Ayat

27. An-Naml (النمل): 93 Ayat

28. Al-Qasas (القصص): 88 Ayat

29. Al-'Ankabut (العنكبوت): 69 Ayat

30. Ar-Rum (الروم): 60 Ayat

31. Luqman (لقمان): 34 Ayat

32. As-Sajdah (السجده): 30 Ayat

33. Al-Ahzab (الاحزاب): 73 Ayat

34. Saba' (سبأ): 54 Ayat

35. Fatir (فاطر): 45 Ayat

36. Ya Sin (يس): 83 Ayat

37. As-Saffat (الصافات): 182 Ayat

38. Sad (ص): 88 Ayat

39. Az-Zumar (الزمر): 75 Ayat

40. Ghafir (غافر): 85 Ayat

41. Fussilat (فصلت): 54 Ayat

42. Asy-Syura (الشورى): 53 Ayat

43. Az-Zukhruf (الزخرف): 89 Ayat

44. Ad-Dukhan (الدخان): 59 Ayat

45. Al-Jasiyah (الجاثية): 37 Ayat

46. Al-Ahqaf (الاحقاف): 45 Ayat

47. Muhammad (محمد): 38 Ayat

48. Al-Fath (الفتح): 29 Ayat

49. Al-Hujurat (الحجرات): 18 Ayat

50. Qaf (ق): 45 Ayat

51. Az-Zariyat (الذاريات): 60 Ayat

52. At-Tur (الطور): 49 Ayat

53. An-Najm (النجم): 62 Ayat

54. Al-Qamar (القمر): 55 Ayat

55. Ar-Rahman (الرحمن): 78 Ayat

56. Al-Waqi'ah (الواقعة): 96 Ayat

57. Al-Hadid (الحديد): 29 Ayat

58. Al-Mujadilah (المجادلة): 22 Ayat

59. Al-Hasyr (الحشر): 24 Ayat

60. Al-Mumtahanah (الممتحنة): 13 Ayat

61. As-Saff (الصف): 14 Ayat

62. Al-Jumu'ah (الجمعة): 11 Ayat

63. Al-Munafiqun (المنافقون): 11 Ayat

64. At-Tagabun (التغابن): 18 Ayat

65. At-Talaq (الطلاق): 12 Ayat

66. At Tahrim (التحريم): 12 Ayat

67. Al-Mulk (المُلك): 30 Ayat

68. Al-Qalam (القلم): 52 Ayat

69. Al-Haqqah (الحاقة): 52 Ayat

70. Al-Ma'arij (المعراج): 44 Ayat

71. Nuh (نوح): 28 Ayat

72. Al-Jinn (الجن): 28 Ayat

73. Al-Muzzammil (المزمل): 20 Ayat

74. Al-Muddassir (المدثر): 56 Ayat

75. Al-Qiyamah (القيامة): 40 Ayat

76. Al-Insan (الانسان): 31 Ayat

77. Al-Mursalat (المرسلات): 50 Ayat

78. An-Naba' (النبأ): 40 Ayat

79. An-Nazi'at (النازعات): 46 Ayat

80. 'Abasa (عبس): 42 Ayat

81. At-Takwir (التكوير): 29 Ayat

82. Al-Infitar (الانفطار): 19 Ayat

83. Al-Mutaffifin (المطففين): 36 Ayat

84. Al-Insyiqaq (الانشقاق): 25 Ayat

85. Al-Buruj (البروج): 22 Ayat

86. At-Tariq (الطارق): 17 Ayat

87. Al-A'la (الاعلى): 19 Ayat

88. Al-Gasyiyah (الجزية): 26 Ayat

89. Al-Fajr (الفجر): 30 Ayat

90. Al-Balad (البلد): 20 Ayat

91. Asy-Syams (الشمس): 15 Ayat

92. Al-Lail (الليل): 21 Ayat

93. Ad-Duha (الضحى): 11 Ayat

94. Al-Insyirah (الشرح): 8 Ayat

95. At-Tin (التين): 8 Ayat

96. Al-'Alaq (العلق): 19 Ayat

97. Al-Qadr (القدر): 5 Ayat

98. Al-Bayyinah (البينه): 8 Ayat

99. Az-Zalzalah (الزلزلة): 8 Ayat

100. Al-'Adiyat (العاديات): 11 Ayat

101. Al-Qari'ah (القارعة): 11 Ayat

102. At-Takasur (التكاثر): 8 Ayat

103. Al-'Asr (العصر): 3 Ayat

104. Al-Humazah (الهمزة): 9 Ayat

105. Al-Fil (الفيل): 5 Ayat

106. Quraisy (قريش): 4 Ayat

107. Al-Ma'un (الماعون): 7 Ayat

108. Al-Kautsar (الكوثر): 3 Ayat

109. Al-Kafirun (الكافرون): 6 Ayat

110. An-Nasr (النصر): 3 Ayat

111. Al-Lahab (المسد): 5 Ayat

112. Al-Ikhlas (الاخلاص): 4 Ayat

113. Al-Falaq (الفلق): 5 Ayat

114. An-Nas (الناس): 6 Ayat

لتشغيل السورة برجاء كتابة الامر- To play the surah, please write the command
(*.surah* "Surah number -رقم السورة") 
`
    await sock.sendMessage(remoteJid, { text: surah }, { quoted: message });

}

module.exports = {
    handle,
    Commands    : ['listsurah', 'listsuroh'],
    OnlyPremium : false, 
    OnlyOwner   : false 
};
