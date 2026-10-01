import type { Locale } from "@/shared/i18n/config";
import type { LandingContent, LandingPage } from "@/features/content/landing/types";

// Arama motorlari icin yazilmis acilis sayfasi metni. Metinlerdeki {phone},
// yayin aninda panelden yonetilen telefon numarasiyla doldurulur.

const tr: LandingContent = {
  h1: "Erzurum öğrenci apart: eğitim dönemine özel konaklama",
  intro:
    "Yurt sırası beklemeden, ev arkadaşı bulma derdi olmadan kendi dairenizde kalın. Eğitim dönemi boyunca sabit fiyat, faturalar dahil, 7/24 kameralı güvenlik.",
  bullets: [
    { title: "Dönemlik fiyat", text: "Eğitim dönemi boyunca sabit ücret; ara tatilde daireniz size ait kalır." },
    { title: "Çalışma düzeni", text: "Her dairede çalışma masası ve kesintisiz fiber internet." },
    { title: "Veliye güven", text: "Kameralı giriş, kimlik kaydı ve düzenli temizlik hizmeti." },
  ],
  body: [
    {
      heading: "Yurt mu, apart mı?",
      text: "Yurtta giriş çıkış saatleri, ortak alan yoğunluğu ve sınırlı çalışma imkânı vardır. Apart dairede kendi programınıza göre yaşar, sınav döneminde istediğiniz saatte çalışırsınız. Mutfağınız olduğu için beslenme masrafınız da düşer. İki veya üç arkadaş 2+1 dairelerimizde kaldığında kişi başı maliyet yurt seviyesine yaklaşır.",
    },
    {
      heading: "Güvenlik ve aile ile iletişim",
      text: "Binamızda 7/24 kamera sistemi ve giriş kontrolü bulunur. Konaklayan her öğrencinin kimlik kaydı tutulur, yasal bildirimler yapılır. Velilerimizle iletişim kanalımız açıktır; acil durumlarda aileye ulaşılır.",
    },
    {
      heading: "Dönem başında yer ayırtın",
      text: "Eylül ve Şubat dönemlerinde daireler hızla dolar. Dönem başlamadan önce yer ayırtmak için arayın; kaporayla dairenizi güvenceye alabilirsiniz.",
    },
  ],
  faqs: [
    {
      q: "Öğrenci konaklamasında fiyat nasıl belirleniyor?",
      a: "Eğitim dönemi boyunca sabit aylık ücret uygulanır ve faturalar bu ücrete dahildir. Güncel fiyat için bizi arayın.",
    },
    {
      q: "Arkadaşımla birlikte kalabilir miyim?",
      a: "Evet. 1+1 dairelerimiz iki kişi, 2+1 dairelerimiz üç-dört kişi için uygundur; maliyet paylaşıldığında kişi başı ücret düşer.",
    },
    {
      q: "Kız ve erkek öğrenciler aynı katta mı kalıyor?",
      a: "Kat ve daire düzenlemesi talep ve müsaitliğe göre ayrı planlanmaktadır. Detay için bizimle görüşün.",
    },
  ],
};

const translations: Record<Locale, LandingContent> = {
  en: {
    h1: "Student apartments in Erzurum: term-based housing",
    intro:
      "No dorm waiting list, no hunting for a roommate — live in your own apartment. Fixed price for the whole academic term, bills included, 24/7 camera security.",
    bullets: [
      { title: "Term-based price", text: "A fixed fee for the whole academic term; your apartment stays yours over breaks." },
      { title: "Built for studying", text: "Every apartment has a desk and uninterrupted fiber internet." },
      { title: "Peace of mind for parents", text: "Camera-monitored entry, guest registration, and regular cleaning service." },
    ],
    body: [
      {
        heading: "Dorm or apartment?",
        text: "Dorms come with fixed entry/exit hours, crowded common areas and limited study space. In an apartment you live on your own schedule and study whenever you need to during exam periods. Having your own kitchen also lowers your food costs. When two or three friends share one of our 2+1 apartments, the cost per person gets close to dorm rates.",
      },
      {
        heading: "Security and staying in touch with family",
        text: "Our building has 24/7 camera monitoring and entry control. Every student's ID is registered and the required official notifications are filed. We keep an open communication channel with parents, and can reach the family in an emergency.",
      },
      {
        heading: "Reserve at the start of term",
        text: "Apartments fill up fast in September and February. Call before term starts to reserve your apartment with a deposit.",
      },
    ],
    faqs: [
      { q: "How is the price set for student housing?", a: "A fixed monthly rate applies for the whole academic term, with bills included. Call us for the current rate." },
      { q: "Can I stay with a friend?", a: "Yes. Our 1+1 apartments suit two people, and our 2+1 apartments suit three to four — sharing the cost lowers the price per person." },
      { q: "Are male and female students on the same floor?", a: "Floor and apartment arrangements are planned separately based on request and availability — get in touch for details." },
    ],
  },
  ru: {
    h1: "Студенческие апартаменты в Эрзуруме: аренда на учебный семестр",
    intro:
      "Без очереди в общежитие, без поиска соседа по комнате — живите в собственных апартаментах. Фиксированная цена на весь учебный период, счета включены, круглосуточное видеонаблюдение.",
    bullets: [
      { title: "Цена за семестр", text: "Фиксированная плата на весь учебный период; апартаменты остаются за вами и на каникулах." },
      { title: "Условия для учёбы", text: "В каждом апартаменте рабочий стол и бесперебойный оптоволоконный интернет." },
      { title: "Спокойствие для родителей", text: "Вход под видеонаблюдением, регистрация гостей и регулярная уборка." },
    ],
    body: [
      {
        heading: "Общежитие или апартаменты?",
        text: "В общежитии — фиксированные часы входа-выхода, загруженные общие зоны и ограниченные возможности для учёбы. В апартаментах вы живёте по своему графику и занимаетесь, когда нужно, в период экзаменов. Собственная кухня также снижает расходы на еду. Когда двое-трое друзей живут в наших апартаментах 2+1, стоимость на человека приближается к цене общежития.",
      },
      {
        heading: "Безопасность и связь с семьёй",
        text: "В нашем здании круглосуточное видеонаблюдение и контроль входа. У каждого проживающего студента регистрируются документы, оформляются необходимые официальные уведомления. У нас открытый канал связи с родителями, в экстренной ситуации мы можем связаться с семьёй.",
      },
      {
        heading: "Бронируйте в начале семестра",
        text: "В сентябре и феврале апартаменты заполняются быстро. Звоните до начала семестра, чтобы забронировать апартаменты с депозитом.",
      },
    ],
    faqs: [
      { q: "Как формируется цена для студенческого проживания?", a: "На весь учебный период действует фиксированная ежемесячная плата, счета включены. Звоните за актуальной ценой." },
      { q: "Могу я жить с другом?", a: "Да. Наши апартаменты 1+1 подходят для двоих, а 2+1 — для трёх-четырёх человек; при разделении стоимости цена на человека снижается." },
      { q: "Живут ли студенты и студентки на одном этаже?", a: "Расположение по этажам и апартаментам планируется отдельно, по запросу и наличию — свяжитесь с нами для деталей." },
    ],
  },
  ar: {
    h1: "شقق طلابية في أرضروم: سكن للفصل الدراسي",
    intro:
      "بدون انتظار دور في السكن الجامعي، وبدون البحث عن زميل سكن — عيشوا في شقتكم الخاصة. سعر ثابت لكامل الفصل الدراسي، الفواتير مشمولة، وأمن بالكاميرات على مدار الساعة.",
    bullets: [
      { title: "سعر الفصل الدراسي", text: "أجرة ثابتة لكامل الفصل الدراسي؛ تبقى شقتكم لكم حتى في العطلة البينية." },
      { title: "بيئة مناسبة للدراسة", text: "في كل شقة مكتب للدراسة وإنترنت ألياف بصرية دون انقطاع." },
      { title: "طمأنينة لأولياء الأمور", text: "دخول مراقب بالكاميرات، تسجيل الضيوف، وخدمة تنظيف منتظمة." },
    ],
    body: [
      {
        heading: "سكن جامعي أم شقة؟",
        text: "السكن الجامعي له أوقات دخول وخروج محددة، ومناطق مشتركة مزدحمة، وإمكانيات دراسة محدودة. في الشقة تعيشون حسب جدولكم الخاص وتدرسون في أي وقت تحتاجونه خلال فترة الامتحانات. كما أن مطبخكم الخاص يقلل من تكاليف الطعام. عندما يشترك صديقان أو ثلاثة في شققنا من نوع 2+1، تقترب التكلفة للفرد من مستوى السكن الجامعي.",
      },
      {
        heading: "الأمان والتواصل مع الأهل",
        text: "في مبنانا نظام كاميرات على مدار الساعة ومراقبة للدخول. يتم تسجيل هوية كل طالب مقيم وإجراء التبليغات الرسمية المطلوبة. لدينا قناة تواصل مفتوحة مع أولياء الأمور، ويمكن التواصل مع العائلة في حالات الطوارئ.",
      },
      {
        heading: "احجزوا في بداية الفصل الدراسي",
        text: "تمتلئ الشقق بسرعة في سبتمبر وفبراير. اتصلوا قبل بداية الفصل الدراسي لحجز شقتكم بعربون.",
      },
    ],
    faqs: [
      { q: "كيف يتم تحديد سعر السكن الطلابي؟", a: "تُطبَّق أجرة شهرية ثابتة لكامل الفصل الدراسي مع شمول الفواتير. اتصلوا بنا لمعرفة السعر الحالي." },
      { q: "هل يمكنني السكن مع صديقي؟", a: "نعم. شققنا 1+1 مناسبة لشخصين، وشقق 2+1 مناسبة لثلاثة إلى أربعة أشخاص؛ ومشاركة التكلفة تخفض السعر للفرد." },
      { q: "هل يسكن الطلاب والطالبات في نفس الطابق؟", a: "يُخطَّط توزيع الطوابق والشقق بشكل منفصل حسب الطلب والتوفر — تواصلوا معنا للتفاصيل." },
    ],
  },
  fa: {
    h1: "آپارتمان دانشجویی در ارزروم: اقامت ترمی",
    intro:
      "بدون نوبت خوابگاه، بدون دردسر پیدا کردن هم‌اتاقی — در آپارتمان خودتان زندگی کنید. قیمت ثابت برای کل ترم تحصیلی، قبوض شامل، امنیت با دوربین ۲۴ ساعته.",
    bullets: [
      { title: "قیمت ترمی", text: "هزینه ثابت برای کل ترم تحصیلی؛ آپارتمان در تعطیلات بین ترم هم برای شماست." },
      { title: "مناسب برای درس خواندن", text: "در هر آپارتمان میز مطالعه و اینترنت فیبر نوری بدون قطعی." },
      { title: "اطمینان‌خاطر برای والدین", text: "ورود تحت نظارت دوربین، ثبت مهمان و خدمات نظافت منظم." },
    ],
    body: [
      {
        heading: "خوابگاه یا آپارتمان؟",
        text: "خوابگاه ساعات ورود و خروج ثابت، فضاهای مشترک شلوغ و امکان مطالعه محدود دارد. در آپارتمان طبق برنامه خودتان زندگی می‌کنید و در دوره امتحانات هر زمان که نیاز باشد درس می‌خوانید. داشتن آشپزخانه شخصی هم هزینه غذا را کاهش می‌دهد. وقتی دو یا سه دوست در آپارتمان‌های 2+1 ما بمانند، هزینه سرانه به سطح خوابگاه نزدیک می‌شود.",
      },
      {
        heading: "امنیت و ارتباط با خانواده",
        text: "ساختمان ما دارای سیستم دوربین ۲۴ ساعته و کنترل ورودی است. مدارک هویتی هر دانشجوی مقیم ثبت و اعلان‌های رسمی لازم انجام می‌شود. کانال ارتباطی ما با والدین باز است و در موارد اضطراری با خانواده تماس گرفته می‌شود.",
      },
      {
        heading: "ابتدای ترم رزرو کنید",
        text: "در شهریور و بهمن آپارتمان‌ها سریع پر می‌شوند. قبل از شروع ترم تماس بگیرید تا با ودیعه جای خود را رزرو کنید.",
      },
    ],
    faqs: [
      { q: "قیمت اقامت دانشجویی چگونه تعیین می‌شود؟", a: "برای کل ترم تحصیلی نرخ ماهانه ثابت اعمال می‌شود و قبوض در آن لحاظ شده است. برای قیمت فعلی تماس بگیرید." },
      { q: "می‌توانم با دوستم بمانم؟", a: "بله. آپارتمان‌های 1+1 ما برای دو نفر و آپارتمان‌های 2+1 برای سه تا چهار نفر مناسب است؛ با تقسیم هزینه، سهم هر نفر کاهش می‌یابد." },
      { q: "آیا دانشجویان دختر و پسر در یک طبقه می‌مانند؟", a: "چیدمان طبقه و آپارتمان بر اساس درخواست و موجودی جداگانه برنامه‌ریزی می‌شود — برای جزئیات با ما تماس بگیرید." },
    ],
  },
  de: {
    h1: "Studentenapartments in Erzurum: Wohnen für ein Semester",
    intro:
      "Keine Warteliste für ein Wohnheim, keine mühsame Mitbewohnersuche — wohnen Sie in Ihrem eigenen Apartment. Fester Preis für das gesamte akademische Semester, Nebenkosten inklusive, 24-Stunden-Kameraüberwachung.",
    bullets: [
      { title: "Semesterpreis", text: "Ein fester Betrag für das gesamte akademische Semester; Ihr Apartment bleibt auch in den Ferien Ihres." },
      { title: "Zum Lernen geeignet", text: "Jedes Apartment verfügt über einen Schreibtisch und unterbrechungsfreies Glasfaserinternet." },
      { title: "Sicherheit für die Eltern", text: "Kameraüberwachter Eingang, Gästeregistrierung und regelmäßiger Reinigungsservice." },
    ],
    body: [
      { heading: "Wohnheim oder Apartment?", text: "Wohnheime haben feste Ein-/Auszeiten, überfüllte Gemeinschaftsbereiche und begrenzten Lernraum. In einem Apartment leben Sie nach Ihrem eigenen Zeitplan und lernen in der Prüfungszeit, wann immer Sie müssen. Eine eigene Küche senkt zudem Ihre Essenskosten. Wenn zwei oder drei Freunde eines unserer 2+1-Apartments teilen, nähern sich die Kosten pro Person den Wohnheimpreisen an." },
      { heading: "Sicherheit und Kontakt zur Familie", text: "Unser Gebäude verfügt über eine 24-Stunden-Kameraüberwachung und Zugangskontrolle. Der Ausweis jedes wohnenden Studenten wird registriert und die erforderlichen offiziellen Meldungen werden vorgenommen. Wir halten einen offenen Kommunikationskanal mit den Eltern und können die Familie im Notfall erreichen." },
      { heading: "Zu Semesterbeginn reservieren", text: "Im September und Februar sind die Apartments schnell ausgebucht. Rufen Sie vor Semesterbeginn an, um Ihr Apartment mit einer Anzahlung zu reservieren." },
    ],
    faqs: [
      { q: "Wie wird der Preis für Studentenwohnen festgelegt?", a: "Für das gesamte akademische Semester gilt ein fester Monatspreis inklusive Nebenkosten. Rufen Sie uns für den aktuellen Preis an." },
      { q: "Kann ich mit einem Freund zusammenwohnen?", a: "Ja. Unsere 1+1-Apartments eignen sich für zwei Personen, unsere 2+1-Apartments für drei bis vier — durch Kostenteilung sinkt der Preis pro Person." },
      { q: "Wohnen Studentinnen und Studenten auf derselben Etage?", a: "Die Etagen- und Apartmentaufteilung wird je nach Wunsch und Verfügbarkeit gesondert geplant — kontaktieren Sie uns für Details." },
    ],
  },
  fr: {
    h1: "Appartements étudiants à Erzurum : logement pour le semestre",
    intro:
      "Pas de liste d'attente pour une résidence universitaire, pas de recherche fastidieuse de colocataire — vivez dans votre propre appartement. Prix fixe pour tout le semestre universitaire, charges incluses, surveillance par caméra 24h/24.",
    bullets: [
      { title: "Prix au semestre", text: "Un montant fixe pour tout le semestre universitaire ; votre appartement reste à vous même pendant les vacances." },
      { title: "Adapté aux études", text: "Chaque appartement dispose d'un bureau et d'un internet fibre sans interruption." },
      { title: "Tranquillité pour les parents", text: "Entrée surveillée par caméra, enregistrement des visiteurs et service de ménage régulier." },
    ],
    body: [
      { heading: "Résidence universitaire ou appartement ?", text: "Les résidences universitaires ont des horaires d'entrée/sortie fixes, des espaces communs bondés et un espace d'étude limité. Dans un appartement, vous vivez selon votre propre emploi du temps et étudiez quand vous en avez besoin pendant les examens. Avoir sa propre cuisine réduit également vos frais de nourriture. Lorsque deux ou trois amis partagent l'un de nos appartements 2+1, le coût par personne se rapproche des tarifs de résidence." },
      { heading: "Sécurité et contact avec la famille", text: "Notre immeuble dispose d'une surveillance par caméra 24h/24 et d'un contrôle d'accès. La pièce d'identité de chaque étudiant résident est enregistrée et les déclarations officielles requises sont effectuées. Nous maintenons un canal de communication ouvert avec les parents et pouvons contacter la famille en cas d'urgence." },
      { heading: "Réservez en début de semestre", text: "En septembre et février, les appartements se remplissent rapidement. Appelez avant le début du semestre pour réserver votre appartement avec un acompte." },
    ],
    faqs: [
      { q: "Comment le prix du logement étudiant est-il fixé ?", a: "Un tarif mensuel fixe s'applique pour tout le semestre universitaire, charges incluses. Appelez-nous pour le tarif actuel." },
      { q: "Puis-je habiter avec un ami ?", a: "Oui. Nos appartements 1+1 conviennent à deux personnes, et nos appartements 2+1 à trois ou quatre personnes ; le partage des coûts réduit le prix par personne." },
      { q: "Les étudiants et étudiantes logent-ils au même étage ?", a: "La répartition des étages et des appartements est planifiée séparément selon la demande et la disponibilité — contactez-nous pour plus de détails." },
    ],
  },
  es: {
    h1: "Apartamentos para estudiantes en Erzurum: alojamiento por semestre",
    intro:
      "Sin lista de espera para residencia, sin la molestia de buscar compañero de piso — viva en su propio apartamento. Precio fijo para todo el semestre académico, gastos incluidos, seguridad con cámaras las 24 horas.",
    bullets: [
      { title: "Precio por semestre", text: "Una tarifa fija para todo el semestre académico; su apartamento sigue siendo suyo incluso durante las vacaciones." },
      { title: "Ideal para estudiar", text: "Cada apartamento tiene un escritorio e internet de fibra óptica ininterrumpido." },
      { title: "Tranquilidad para los padres", text: "Entrada vigilada por cámaras, registro de huéspedes y servicio de limpieza regular." },
    ],
    body: [
      { heading: "¿Residencia o apartamento?", text: "Las residencias tienen horarios fijos de entrada/salida, áreas comunes abarrotadas y espacio de estudio limitado. En un apartamento, usted vive según su propio horario y estudia cuando lo necesite durante los exámenes. Tener su propia cocina también reduce sus gastos de comida. Cuando dos o tres amigos comparten uno de nuestros apartamentos 2+1, el costo por persona se acerca al de una residencia." },
      { heading: "Seguridad y contacto con la familia", text: "Nuestro edificio cuenta con vigilancia por cámaras las 24 horas y control de acceso. Se registra la identificación de cada estudiante residente y se realizan las notificaciones oficiales requeridas. Mantenemos un canal de comunicación abierto con los padres y podemos contactar a la familia en caso de emergencia." },
      { heading: "Reserve al inicio del semestre", text: "En septiembre y febrero los apartamentos se llenan rápidamente. Llame antes de que comience el semestre para reservar su apartamento con un depósito." },
    ],
    faqs: [
      { q: "¿Cómo se fija el precio del alojamiento estudiantil?", a: "Se aplica una tarifa mensual fija para todo el semestre académico, con los gastos incluidos. Llámenos para conocer el precio actual." },
      { q: "¿Puedo vivir con un amigo?", a: "Sí. Nuestros apartamentos 1+1 son adecuados para dos personas, y los 2+1 para tres o cuatro; al compartir el costo, el precio por persona baja." },
      { q: "¿Los estudiantes y estudiantas viven en el mismo piso?", a: "La distribución de pisos y apartamentos se planifica por separado según la solicitud y disponibilidad — contáctenos para más detalles." },
    ],
  },
  az: {
    h1: "Ərzurumda tələbə mənzilləri: semestrlik yaşayış",
    intro:
      "Yataqxana növbəsi yoxdur, otaq yoldaşı axtarmaq əziyyəti yoxdur — öz mənzilinizdə yaşayın. Bütün akademik semestr üçün sabit qiymət, kommunal xərclər daxil, 24 saat kamera təhlükəsizliyi.",
    bullets: [
      { title: "Semestr qiyməti", text: "Bütün akademik semestr üçün sabit ödəniş; mənziliniz tətil zamanı da sizindir." },
      { title: "Dərs üçün əlverişli", text: "Hər mənzildə iş masası və fasiləsiz optik internet var." },
      { title: "Valideynlər üçün arxayınlıq", text: "Kamera ilə nəzarət olunan giriş, qonaq qeydiyyatı və müntəzəm təmizlik xidməti." },
    ],
    body: [
      { heading: "Yataqxana yoxsa mənzil?", text: "Yataqxanalarda sabit giriş-çıxış saatları, izdihamlı ortaq sahələr və məhdud dərs mühiti olur. Mənzildə öz cədvəlinizə uyğun yaşayır, imtahan dövründə lazım olduqda dərs oxuyursunuz. Öz mətbəxinizin olması yemək xərclərinizi də azaldır. İki və ya üç dost 2+1 mənzillərimizdən birini paylaşdıqda, nəfər başına xərc yataqxana qiymətlərinə yaxınlaşır." },
      { heading: "Təhlükəsizlik və ailə ilə əlaqə", text: "Binamızda 24 saat kamera nəzarəti və giriş kontrolu var. Yaşayan hər tələbənin şəxsiyyəti qeydə alınır və lazımi rəsmi bildirişlər edilir. Valideynlərlə açıq ünsiyyət kanalı saxlayırıq və təcili hallarda ailə ilə əlaqə saxlaya bilərik." },
      { heading: "Semestr əvvəlində rezervasiya edin", text: "Sentyabr və fevralda mənzillər tez dolur. Semestr başlamazdan əvvəl zəng edib depozitlə mənzilinizi rezerv edin." },
    ],
    faqs: [
      { q: "Tələbə yaşayışının qiyməti necə müəyyən edilir?", a: "Bütün akademik semestr üçün sabit aylıq qiymət tətbiq olunur, kommunal xərclər daxildir. Cari qiymət üçün bizə zəng edin." },
      { q: "Dostumla birgə yaşaya bilərəmmi?", a: "Bəli. 1+1 mənzillərimiz iki nəfər üçün, 2+1 mənzillərimiz üç-dörd nəfər üçün uyğundur; xərci bölüşdürməklə nəfər başına qiymət azalır." },
      { q: "Qız və oğlan tələbələr eyni mərtəbədə qalırmı?", a: "Mərtəbə və mənzil bölgüsü tələb və mövcudluğa əsasən ayrıca planlaşdırılır — təfərrüat üçün bizimlə əlaqə saxlayın." },
    ],
  },
  ka: {
    h1: "სტუდენტური ბინები ერზურუმში: სემესტრული საცხოვრებელი",
    intro:
      "საერთო საცხოვრებლის რიგი არ არის, ხელისშემშლელი თანამობინადრის ძებნა არ არის — იცხოვრეთ საკუთარ ბინაში. ფიქსირებული ფასი მთელი აკადემიური სემესტრისთვის, კომუნალური გადასახადები შედის, 24-საათიანი კამერის უსაფრთხოება.",
    bullets: [
      { title: "სემესტრული ფასი", text: "ფიქსირებული საფასური მთელი აკადემიური სემესტრისთვის; თქვენი ბინა თქვენია არდადეგების დროსაც." },
      { title: "სწავლისთვის მოსახერხებელი", text: "ყველა ბინას აქვს სამუშაო მაგიდა და შეუფერხებელი ოპტიკურ-ბოჭკოვანი ინტერნეტი." },
      { title: "სიმშვიდე მშობლებისთვის", text: "კამერით კონტროლირებადი შესასვლელი, სტუმრების რეგისტრაცია და რეგულარული დასუფთავების სერვისი." },
    ],
    body: [
      { heading: "საერთო საცხოვრებელი თუ ბინა?", text: "საერთო საცხოვრებლებში ფიქსირებული შესვლა-გასვლის საათებია, გადატვირთული საერთო სივრცეები და შეზღუდული სასწავლო სივრცე. ბინაში ცხოვრობთ საკუთარი განრიგით და სწავლობთ საჭიროებისამებრ საგამოცდო პერიოდში. საკუთარი სამზარეულოც ამცირებს კვების ხარჯებს. როცა ორი ან სამი მეგობარი იზიარებს ჩვენს 2+1 ბინებს, ერთ ადამიანზე ღირებულება უახლოვდება საერთო საცხოვრებლის ფასებს." },
      { heading: "უსაფრთხოება და ოჯახთან კავშირი", text: "ჩვენს შენობას აქვს 24-საათიანი კამერის მეთვალყურეობა და შესვლის კონტროლი. თითოეული მცხოვრები სტუდენტის პირადობა რეგისტრირდება და კეთდება საჭირო ოფიციალური შეტყობინებები. ვინარჩუნებთ ღია საკომუნიკაციო არხს მშობლებთან და საგანგებო სიტუაციაში შეგვიძლია დავუკავშირდეთ ოჯახს." },
      { heading: "დაჯავშნეთ სემესტრის დასაწყისში", text: "სექტემბერსა და თებერვალში ბინები სწრაფად ივსება. დარეკეთ სემესტრის დაწყებამდე დეპოზიტით თქვენი ბინის დასაჯავშნად." },
    ],
    faqs: [
      { q: "როგორ განისაზღვრება სტუდენტური საცხოვრებლის ფასი?", a: "მთელი აკადემიური სემესტრისთვის მოქმედებს ფიქსირებული ყოველთვიური ტარიფი, კომუნალური გადასახადების ჩათვლით. დარეკეთ მიმდინარე ფასისთვის." },
      { q: "შემიძლია მეგობართან ერთად ცხოვრება?", a: "დიახ. ჩვენი 1+1 ბინები შესაფერისია ორი ადამიანისთვის, ხოლო 2+1 ბინები სამი-ოთხი ადამიანისთვის; ხარჯის გაყოფით ერთ ადამიანზე ფასი მცირდება." },
      { q: "ცხოვრობენ თუ არა სტუდენტი ბიჭები და გოგოები ერთ სართულზე?", a: "სართულებისა და ბინების განაწილება იგეგმება ცალკე მოთხოვნისა და ხელმისაწვდომობის მიხედვით — დეტალებისთვის დაგვიკავშირდით." },
    ],
  },
};

export const studentLanding: LandingPage = {
  path: "/erzurum-ogrenci-apart",
  seo: {
    title: "Erzurum Öğrenci Apart — Dönemlik Kiralık Apart Daire",
    description:
      "Erzurum'da öğrenciler için dönemlik kiralık apart daire. Güvenli, faturalar dahil, çalışma masalı 1+0, 1+1 ve 2+1 daireler. {phone}",
  },
  tr,
  translations,
};
