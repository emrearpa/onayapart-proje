import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingTemplate, { LandingContent } from "@/components/LandingTemplate";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const revalidate = 600;

const content: Record<Locale, LandingContent> = {
  en: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Daily furnished apartments in Erzurum",
    intro:
      "A roomier, kitchen-equipped and more affordable alternative to a hotel room for business trips, hospital visits or a short city stopover. At Onay Apart Rezidans, bills, internet and cleaning are included in daily stays.",
    bullets: [
      { title: "Kitchen included", text: "A fitted kitchen with cookware lets you prepare your own meals." },
      { title: "Central location", text: "In Yakutiye Muratpaşa, walking distance to the bazaar and public transport." },
      { title: "Same-day availability", text: "Call us and we'll hand over a free apartment the same day." },
    ],
    body: [
      {
        heading: "Apartment or hotel for a day?",
        text: "A hotel room may be enough for a single night in Erzurum, but for a few days an apart-hotel is both roomier and more economical. With your own kitchen you don't have to eat out every meal, and a washing machine means less luggage on longer trips. For families or groups, the cost per person drops noticeably compared to a hotel.",
      },
      {
        heading: "Who chooses us?",
        text: "Business travellers, hospital companions, ski groups heading to Palandöken in winter, and short-term visitors all choose our daily apartments. We're flexible with early check-in and late check-out requests, depending on availability.",
      },
      {
        heading: "Booking and check-in",
        text: "Daily bookings are made by phone or WhatsApp. Showing ID at check-in is a legal requirement, and we handle the official guest registration for you. Check-in is at 14:00 and check-out at 12:00; both can be flexible if the apartment is available.",
      },
    ],
    faqs: [
      { q: "How much are daily apartments in Erzurum?", a: "Price varies by apartment type and season; call us at the number above for the current rate, especially during ski season." },
      { q: "Do you accept single-night stays?", a: "Yes, subject to availability." },
      { q: "Are towels and bedding provided?", a: "Yes. Every apartment comes with clean bedding and towels, changed regularly for longer stays." },
    ],
  },
  ru: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Посуточные меблированные апартаменты в Эрзуруме",
    intro:
      "Более просторная, с кухней и экономичная альтернатива номеру в отеле — для командировок, визита в больницу или короткой остановки в городе. В Onay Apart Rezidans счета, интернет и уборка включены в посуточное проживание.",
    bullets: [
      { title: "Кухня в наличии", text: "Встроенная кухня с посудой — готовьте сами." },
      { title: "Центральное расположение", text: "Район Якутие Муратпаша, в шаговой доступности от рынка и остановок транспорта." },
      { title: "Заселение в тот же день", text: "Позвоните нам — свободный апартамент передадим в тот же день." },
    ],
    body: [
      {
        heading: "Апартаменты или отель на один день?",
        text: "Для одной ночи в Эрзуруме может хватить номера в отеле, но на несколько дней апартаменты выгоднее и просторнее. Своя кухня избавляет от необходимости есть вне дома каждый раз, а стиральная машина уменьшает багаж в долгих поездках. Для семей и групп стоимость на человека заметно ниже, чем в отеле.",
      },
      {
        heading: "Кто выбирает нас?",
        text: "Командированные, сопровождающие пациентов, горнолыжные группы, едущие на Паландёкен зимой, и краткосрочные гости выбирают наши посуточные апартаменты. Мы гибко подходим к раннему заселению и позднему выезду в зависимости от наличия.",
      },
      {
        heading: "Бронирование и заселение",
        text: "Посуточное бронирование — по телефону или WhatsApp. Предъявление документа при заселении обязательно по закону, регистрацию гостя оформляем мы. Заезд в 14:00, выезд в 12:00; возможна гибкость при наличии апартамента.",
      },
    ],
    faqs: [
      { q: "Сколько стоят посуточные апартаменты в Эрзуруме?", a: "Цена зависит от типа апартамента и сезона; позвоните нам за актуальной ценой, особенно в горнолыжный сезон." },
      { q: "Принимаете ли вы заезд на одну ночь?", a: "Да, при наличии свободных апартаментов." },
      { q: "Предоставляются ли полотенца и постельное бельё?", a: "Да. Все апартаменты сдаются с чистым бельём и полотенцами, которые регулярно меняются при долгом проживании." },
    ],
  },
  ar: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "شقق مفروشة يومية في أرضروم",
    intro:
      "بديل أوسع ومجهز بمطبخ وأكثر اقتصادية من غرفة الفندق لرحلات العمل أو زيارات المستشفى أو التوقف القصير في المدينة. في أوناي أبارتريزيدانس، الفواتير والإنترنت والتنظيف مشمولة في الإقامة اليومية.",
    bullets: [
      { title: "مطبخ متوفر", text: "مطبخ مجهز بالأواني يتيح لكم تحضير طعامكم بأنفسكم." },
      { title: "موقع مركزي", text: "في ياكوتيه مراد باشا، على مسافة قريبة من السوق ومحطات النقل العام." },
      { title: "توفر فوري", text: "اتصلوا بنا وسنسلمكم شقة متاحة في نفس اليوم." },
    ],
    body: [
      {
        heading: "شقة أم فندق ليوم واحد؟",
        text: "قد تكفي غرفة الفندق لليلة واحدة في أرضروم، لكن لعدة أيام تكون الشقة المفروشة أوسع وأكثر اقتصادية. بفضل مطبخكم الخاص لن تضطروا لتناول الطعام بالخارج في كل وجبة، وتقلل الغسالة من عبء الأمتعة في الرحلات الطويلة. بالنسبة للعائلات أو المجموعات، تنخفض التكلفة للفرد بشكل ملحوظ مقارنة بالفندق.",
      },
      {
        heading: "من يفضلنا؟",
        text: "رجال الأعمال القادمون من خارج المدينة، مرافقو المرضى، مجموعات التزلج المتجهة إلى بالاندوكن شتاءً، والزوار قصيرو المدة يفضلون شققنا اليومية. نوفر مرونة في طلبات الدخول المبكر والخروج المتأخر حسب التوفر.",
      },
      {
        heading: "الحجز والدخول",
        text: "تتم الحجوزات اليومية عبر الهاتف أو واتساب. إبراز الهوية عند الدخول إلزامي قانونياً، ونتولى نحن إجراءات التبليغ الرسمي عن الضيف. وقت الدخول الساعة 14:00 والخروج الساعة 12:00، ويمكن المرونة إذا كانت الشقة متاحة.",
      },
    ],
    faqs: [
      { q: "كم سعر الشقق اليومية في أرضروم؟", a: "يختلف السعر حسب نوع الشقة والموسم؛ اتصلوا بالرقم أعلاه لمعرفة السعر الحالي، خاصة في موسم التزلج." },
      { q: "هل تقبلون الإقامة لليلة واحدة؟", a: "نعم، حسب التوفر." },
      { q: "هل يتم توفير المناشف والأغطية؟", a: "نعم. جميع شققنا تُسلَّم بأغطية ومناشف نظيفة، وتُستبدل بانتظام في الإقامات الطويلة." },
    ],
  },
  fa: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "آپارتمان‌های مبله روزانه در ارزروم",
    intro:
      "جایگزینی وسیع‌تر، مجهز به آشپزخانه و مقرون‌به‌صرفه‌تر از اتاق هتل برای سفرهای کاری، ملاقات بیمارستانی یا توقف کوتاه در شهر. در اونای آپارت رزیدانس، قبوض، اینترنت و نظافت در اقامت روزانه لحاظ شده است.",
    bullets: [
      { title: "آشپزخانه مجهز", text: "با آشپزخانه و وسایل آن می‌توانید غذای خود را آماده کنید." },
      { title: "موقعیت مرکزی", text: "در یاکوتیه مرادپاشا، در فاصله پیاده تا بازار و ایستگاه‌های حمل‌ونقل عمومی." },
      { title: "موجودی همان روز", text: "تماس بگیرید تا همان روز آپارتمان خالی را تحویل بگیرید." },
    ],
    body: [
      {
        heading: "آپارتمان یا هتل برای یک روز؟",
        text: "برای یک شب در ارزروم اتاق هتل ممکن است کافی باشد، اما برای چند روز، آپارتمان مبله هم وسیع‌تر و هم مقرون‌به‌صرفه‌تر است. با آشپزخانه خودتان مجبور نیستید هر وعده بیرون غذا بخورید و ماشین لباسشویی بار چمدان را در سفرهای طولانی کم می‌کند. برای خانواده‌ها یا گروه‌ها، هزینه سرانه به‌طور محسوسی نسبت به هتل کاهش می‌یابد.",
      },
      {
        heading: "چه کسانی ما را انتخاب می‌کنند؟",
        text: "کارمندان و تجار خارج از شهر، همراهان بیماران، گروه‌های اسکی که زمستان به پالاندوکن می‌آیند و بازدیدکنندگان کوتاه‌مدت، اقامت روزانه ما را انتخاب می‌کنند. برای ورود زودهنگام و خروج دیرهنگام بسته به موجودی انعطاف داریم.",
      },
      {
        heading: "رزرو و ورود",
        text: "رزروهای روزانه از طریق تلفن یا واتس‌اپ انجام می‌شود. ارائه مدرک شناسایی هنگام ورود الزام قانونی است و ثبت مهمان توسط ما انجام می‌شود. ساعت ورود ۱۴:۰۰ و خروج ۱۲:۰۰ است؛ در صورت موجود بودن آپارتمان قابل انعطاف است.",
      },
    ],
    faqs: [
      { q: "قیمت آپارتمان‌های روزانه در ارزروم چقدر است؟", a: "قیمت بسته به نوع آپارتمان و فصل متفاوت است؛ برای قیمت فعلی با شماره بالا تماس بگیرید، به‌ویژه در فصل اسکی." },
      { q: "آیا اقامت یک‌شبه می‌پذیرید؟", a: "بله، بسته به موجودی." },
      { q: "آیا حوله و ملحفه ارائه می‌شود؟", a: "بله. تمام آپارتمان‌ها با ملحفه و حوله تمیز تحویل داده می‌شوند و در اقامت‌های طولانی به‌طور منظم تعویض می‌شوند." },
    ],
  },
  de: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Tägliche möblierte Apartments in Erzurum",
    intro:
      "Eine geräumigere, mit Küche ausgestattete und günstigere Alternative zum Hotelzimmer für Geschäftsreisen, Krankenhausbesuche oder einen kurzen Zwischenstopp in der Stadt. Im Onay Apart Rezidans sind Nebenkosten, Internet und Reinigung im Tagespreis inbegriffen.",
    bullets: [
      { title: "Küche inklusive", text: "Eine ausgestattete Küche mit Kochgeschirr ermöglicht Ihnen, selbst zu kochen." },
      { title: "Zentrale Lage", text: "In Yakutiye Muratpaşa, fußläufig zum Basar und zu öffentlichen Verkehrsmitteln." },
      { title: "Verfügbarkeit am selben Tag", text: "Rufen Sie uns an, und wir übergeben Ihnen noch am selben Tag ein freies Apartment." },
    ],
    body: [
      {
        heading: "Apartment oder Hotel für einen Tag?",
        text: "Für eine Nacht in Erzurum mag ein Hotelzimmer ausreichen, aber für mehrere Tage ist ein Apartment sowohl geräumiger als auch wirtschaftlicher. Mit eigener Küche müssen Sie nicht bei jeder Mahlzeit auswärts essen, und eine Waschmaschine reduziert das Gepäck bei längeren Reisen. Für Familien oder Gruppen sinken die Kosten pro Person spürbar im Vergleich zum Hotel.",
      },
      {
        heading: "Wer entscheidet sich für uns?",
        text: "Geschäftsreisende, Begleitpersonen von Patienten, Skigruppen, die im Winter nach Palandöken fahren, und Kurzzeitbesucher wählen alle unsere Tagesapartments. Wir sind flexibel bei Wünschen nach frühem Check-in und spätem Check-out, je nach Verfügbarkeit.",
      },
      {
        heading: "Buchung und Check-in",
        text: "Tagesbuchungen erfolgen per Telefon oder WhatsApp. Die Vorlage eines Ausweises beim Check-in ist gesetzlich vorgeschrieben, und wir übernehmen die offizielle Gästemeldung für Sie. Check-in ist um 14:00 Uhr und Check-out um 12:00 Uhr; beides kann bei Verfügbarkeit flexibel gehandhabt werden.",
      },
    ],
    faqs: [
      { q: "Wie viel kosten Tagesapartments in Erzurum?", a: "Der Preis variiert je nach Apartmenttyp und Saison; rufen Sie uns unter der obigen Nummer für den aktuellen Preis an, besonders während der Skisaison." },
      { q: "Akzeptieren Sie Aufenthalte für nur eine Nacht?", a: "Ja, je nach Verfügbarkeit." },
      { q: "Werden Handtücher und Bettwäsche gestellt?", a: "Ja. Jedes Apartment wird mit sauberer Bettwäsche und Handtüchern ausgestattet, die bei längeren Aufenthalten regelmäßig gewechselt werden." },
    ],
  },
  fr: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Appartements meublés journaliers à Erzurum",
    intro:
      "Une alternative plus spacieuse, équipée d'une cuisine et plus économique qu'une chambre d'hôtel pour les voyages d'affaires, les visites à l'hôpital ou une courte escale en ville. À l'Onay Apart Rezidans, les charges, l'internet et le ménage sont inclus dans les séjours journaliers.",
    bullets: [
      { title: "Cuisine incluse", text: "Une cuisine équipée avec ustensiles vous permet de préparer vos propres repas." },
      { title: "Emplacement central", text: "À Yakutiye Muratpaşa, à distance de marche du bazar et des transports en commun." },
      { title: "Disponibilité le jour même", text: "Appelez-nous et nous vous remettrons un appartement libre le jour même." },
    ],
    body: [
      {
        heading: "Appartement ou hôtel pour une journée ?",
        text: "Une chambre d'hôtel peut suffire pour une nuit à Erzurum, mais pour plusieurs jours, un appartement meublé est à la fois plus spacieux et plus économique. Avec votre propre cuisine, vous n'êtes pas obligé de manger dehors à chaque repas, et une machine à laver réduit les bagages lors des voyages plus longs. Pour les familles ou les groupes, le coût par personne diminue nettement par rapport à l'hôtel.",
      },
      {
        heading: "Qui nous choisit ?",
        text: "Les voyageurs d'affaires, les accompagnateurs de patients, les groupes de skieurs se rendant à Palandöken en hiver et les visiteurs de courte durée choisissent tous nos appartements journaliers. Nous sommes flexibles concernant les demandes d'arrivée anticipée et de départ tardif, selon la disponibilité.",
      },
      {
        heading: "Réservation et arrivée",
        text: "Les réservations journalières se font par téléphone ou WhatsApp. La présentation d'une pièce d'identité à l'arrivée est une obligation légale, et nous nous chargeons de l'enregistrement officiel des clients. L'arrivée est à 14h00 et le départ à 12h00 ; les deux peuvent être flexibles selon la disponibilité de l'appartement.",
      },
    ],
    faqs: [
      { q: "Quel est le prix des appartements journaliers à Erzurum ?", a: "Le prix varie selon le type d'appartement et la saison ; appelez-nous au numéro ci-dessus pour connaître le tarif actuel, surtout pendant la saison de ski." },
      { q: "Acceptez-vous les séjours d'une seule nuit ?", a: "Oui, selon disponibilité." },
      { q: "Les serviettes et le linge de lit sont-ils fournis ?", a: "Oui. Chaque appartement est fourni avec du linge de lit et des serviettes propres, changés régulièrement pour les séjours plus longs." },
    ],
  },
  es: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Apartamentos amueblados diarios en Erzurum",
    intro:
      "Una alternativa más espaciosa, equipada con cocina y más económica que una habitación de hotel para viajes de negocios, visitas al hospital o una breve escala en la ciudad. En Onay Apart Rezidans, los gastos, el internet y la limpieza están incluidos en las estancias diarias.",
    bullets: [
      { title: "Cocina incluida", text: "Una cocina equipada con utensilios le permite preparar sus propias comidas." },
      { title: "Ubicación central", text: "En Yakutiye Muratpaşa, a poca distancia a pie del bazar y del transporte público." },
      { title: "Disponibilidad el mismo día", text: "Llámenos y le entregaremos un apartamento libre el mismo día." },
    ],
    body: [
      {
        heading: "¿Apartamento u hotel por un día?",
        text: "Una habitación de hotel puede bastar para una noche en Erzurum, pero para varios días, un apartamento amueblado es más espacioso y económico. Con su propia cocina, no tiene que comer fuera en cada comida, y una lavadora reduce el equipaje en viajes más largos. Para familias o grupos, el costo por persona baja notablemente en comparación con el hotel.",
      },
      {
        heading: "¿Quién nos elige?",
        text: "Viajeros de negocios, acompañantes de pacientes, grupos de esquí que van a Palandöken en invierno y visitantes de corta duración eligen todos nuestros apartamentos diarios. Somos flexibles con las solicitudes de entrada anticipada y salida tardía, según disponibilidad.",
      },
      {
        heading: "Reserva y llegada",
        text: "Las reservas diarias se hacen por teléfono o WhatsApp. Presentar una identificación al llegar es un requisito legal, y nosotros nos encargamos del registro oficial de huéspedes. La entrada es a las 14:00 y la salida a las 12:00; ambas pueden ser flexibles según disponibilidad del apartamento.",
      },
    ],
    faqs: [
      { q: "¿Cuánto cuestan los apartamentos diarios en Erzurum?", a: "El precio varía según el tipo de apartamento y la temporada; llámenos al número indicado para conocer la tarifa actual, especialmente en temporada de esquí." },
      { q: "¿Aceptan estancias de una sola noche?", a: "Sí, según disponibilidad." },
      { q: "¿Se proporcionan toallas y ropa de cama?", a: "Sí. Cada apartamento se entrega con ropa de cama y toallas limpias, que se cambian regularmente en estancias más largas." },
    ],
  },
  az: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "Ərzurumda günlük mebelli mənzillər",
    intro:
      "İş səfərləri, xəstəxana ziyarətləri və ya şəhərdə qısa dayanacaq üçün otel otağından daha geniş, mətbəxli və daha sərfəli alternativ. Onay Apart Rezidans-da kommunal xərclər, internet və təmizlik günlük qalma qiymətinə daxildir.",
    bullets: [
      { title: "Mətbəx daxildir", text: "Qab-qacaqlı təchiz olunmuş mətbəx öz yeməyinizi hazırlamağa imkan verir." },
      { title: "Mərkəzi yerləşmə", text: "Yakutiye Muratpaşa-da, bazara və ictimai nəqliyyata piyada məsafədə." },
      { title: "Eyni gündə mövcudluq", text: "Bizə zəng edin, eyni gün boş mənzili sizə təhvil verək." },
    ],
    body: [
      {
        heading: "Bir gün üçün mənzil yoxsa otel?",
        text: "Ərzurumda bir gecə üçün otel otağı kifayət edə bilər, lakin bir neçə gün üçün mebelli mənzil həm daha genişdir, həm də daha sərfəlidir. Öz mətbəxinizlə hər yeməyi bayırda yemək məcburiyyətində qalmırsınız, paltaryuyan maşın isə uzun səfərlərdə baqajı azaldır. Ailələr və ya qruplar üçün nəfər başına xərc otelə nisbətən kəskin şəkildə azalır.",
      },
      {
        heading: "Bizi kim seçir?",
        text: "İş adamları, xəstə müşayiətçiləri, qışda Palandökənə gedən xizək qrupları və qısamüddətli ziyarətçilər günlük mənzillərimizi seçirlər. Erkən giriş və gec çıxış tələblərinə uyğunluq əsasında çevik yanaşırıq.",
      },
      {
        heading: "Rezervasiya və giriş",
        text: "Günlük rezervasiyalar telefon və ya WhatsApp vasitəsilə edilir. Girişdə şəxsiyyət vəsiqəsinin təqdim edilməsi qanuni tələbdir, rəsmi qonaq qeydiyyatını biz aparırıq. Giriş saat 14:00, çıxış saat 12:00-dır; mənzilin mövcudluğuna görə hər ikisi çevik ola bilər.",
      },
    ],
    faqs: [
      { q: "Ərzurumda günlük mənzillərin qiyməti nə qədərdir?", a: "Qiymət mənzil növünə və mövsümə görə dəyişir; xüsusilə xizək mövsümündə cari qiymət üçün yuxarıdakı nömrəyə zəng edin." },
      { q: "Bir gecəlik qalmanı qəbul edirsinizmi?", a: "Bəli, mövcudluğa əsasən." },
      { q: "Dəsmal və yataq dəsti verilirmi?", a: "Bəli. Hər mənzil təmiz yataq dəsti və dəsmallarla təhvil verilir, uzun qalmalarda müntəzəm dəyişdirilir." },
    ],
  },
  ka: {
    path: "/gunluk-kiralik-apart-erzurum",
    h1: "დღიური ავეჯით აღჭურვილი ბინები ერზურუმში",
    intro:
      "უფრო ფართო, სამზარეულოთი აღჭურვილი და სასტუმროს ოთახზე უფრო ხელმისაწვდომი ალტერნატივა საქმიანი მოგზაურობებისთვის, საავადმყოფოს ვიზიტებისთვის ან ქალაქში მოკლე გაჩერებისთვის. Onay Apart Rezidans-ში კომუნალური გადასახადები, ინტერნეტი და დასუფთავება შედის დღიურ ფასში.",
    bullets: [
      { title: "სამზარეულო შედის", text: "აღჭურვილი სამზარეულო ჭურჭლით საშუალებას გაძლევთ თავად მოამზადოთ საკვები." },
      { title: "ცენტრალური მდებარეობა", text: "იაკუტიე მურატფაშაში, ბაზრისა და საზოგადოებრივი ტრანსპორტის ფეხით სავალ მანძილზე." },
      { title: "ხელმისაწვდომობა იმავე დღეს", text: "დაგვირეკეთ და იმავე დღეს გადმოგცემთ თავისუფალ ბინას." },
    ],
    body: [
      {
        heading: "ბინა თუ სასტუმრო ერთი დღით?",
        text: "ერზურუმში ერთი ღამისთვის სასტუმროს ოთახი შეიძლება საკმარისი იყოს, მაგრამ რამდენიმე დღით ავეჯით აღჭურვილი ბინა როგორც უფრო ფართოა, ასევე უფრო ეკონომიური. საკუთარი სამზარეულოთი არ გიწევთ ყოველ ჯერზე გარეთ ჭამა, ხოლო სარეცხი მანქანა ამცირებს ბარგს გრძელვადიან მოგზაურობებში. ოჯახებისთვის ან ჯგუფებისთვის ერთ ადამიანზე ღირებულება საგრძნობლად მცირდება სასტუმროსთან შედარებით.",
      },
      {
        heading: "ვინ ირჩევს ჩვენ?",
        text: "საქმიანი მოგზაურები, პაციენტების თანმხლები პირები, ზამთარში პალანდოკენში მიმავალი სათხილამურო ჯგუფები და მოკლევადიანი სტუმრები ირჩევენ ჩვენს დღიურ ბინებს. მოქნილები ვართ ადრეული ჩექინისა და გვიანი გასვლის მოთხოვნებთან, ხელმისაწვდომობის მიხედვით.",
      },
      {
        heading: "დაჯავშნა და ჩამოსვლა",
        text: "დღიური დაჯავშნები ხდება ტელეფონით ან WhatsApp-ით. პირადობის მოწმობის წარდგენა ჩექინისას კანონით მოთხოვნილია, ხოლო ოფიციალურ სტუმრის რეგისტრაციას ჩვენ ვახორციელებთ. ჩექინი 14:00 საათზეა, გასვლა 12:00 საათზე; ორივე შეიძლება იყოს მოქნილი ბინის ხელმისაწვდომობის მიხედვით.",
      },
    ],
    faqs: [
      { q: "რა ღირს დღიური ბინები ერზურუმში?", a: "ფასი განსხვავდება ბინის ტიპისა და სეზონის მიხედვით; დარეკეთ ზემოთ მითითებულ ნომერზე მიმდინარე ფასისთვის, განსაკუთრებით სათხილამურო სეზონზე." },
      { q: "იღებთ ერთი ღამის ცხოვრებას?", a: "დიახ, ხელმისაწვდომობის მიხედვით." },
      { q: "ეძლევა თუ არა პირსახოცები და თეთრეული?", a: "დიახ. ყველა ბინა გადაეცემა სუფთა თეთრეულითა და პირსახოცებით, რომლებიც რეგულარულად იცვლება ხანგრძლივი ცხოვრებისას." },
    ],
  },
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  if (!isLocale(params.locale)) return {};
  const c = content[params.locale];
  return { title: `${c.h1} — Onay Apart`, description: c.intro.slice(0, 155), alternates: { canonical: `/${params.locale}${c.path}` } };
}

export default function Page({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  return <LandingTemplate content={content[params.locale]} locale={params.locale} />;
}
