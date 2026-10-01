import type { Metadata } from "next";
import { notFound } from "next/navigation";
import LandingTemplate, { LandingContent } from "@/features/content/components/LandingTemplate";
import { isLocale, type Locale } from "@/shared/i18n/config";

export const revalidate = 600;

const content: Record<Locale, LandingContent> = {
  en: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Monthly furnished apartments for rent in Erzurum",
    intro:
      "For those relocating to Erzurum for a transfer, a temporary assignment or a long-term job: apartments you can move into within the same week, with no furniture to bring, no lease, and no utility signups.",
    bullets: [
      { title: "Bills included", text: "Gas, electricity, water and internet are included in the monthly rate — no separate subscriptions needed." },
      { title: "No furniture to move", text: "Appliances, furniture and kitchenware are already in place." },
      { title: "Flexible term", text: "Stays start from one month and can be extended." },
    ],
    body: [
      {
        heading: "Renting an empty flat vs. an apartment",
        text: "Renting an empty flat in Erzurum means a deposit, a lease, utility subscriptions and furniture costs — none of which pay off if you're only staying a few months. With a monthly apartment you make one payment; heating, internet and cleaning are included, so there's no surprise bill at month's end.",
      },
      {
        heading: "Ready for Erzurum winters",
        text: "Heating is one of the most important comforts in Erzurum. Our apartments have natural-gas heating and uninterrupted 24-hour hot water. Since heating cost is included in the monthly rate, you can plan your budget with certainty even in winter.",
      },
      {
        heading: "Corporate stays",
        text: "We arrange corporate-invoiced, long-term stay agreements for construction, project and temporary-assignment teams, with bulk pricing for companies needing multiple apartments.",
      },
    ],
    faqs: [
      { q: "Is a deposit required for monthly rentals?", a: "Yes, a standard deposit is taken for long-term stays and refunded at checkout if there is no damage." },
      { q: "Are bills included in the price?", a: "Gas, electricity, water and internet are included in the monthly rate. Unusually high consumption is assessed separately." },
      { q: "Do you issue corporate invoices?", a: "Yes. Corporate stays are invoiced and a contract is arranged." },
    ],
  },
  ru: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Меблированные апартаменты на месяц в Эрзуруме",
    intro:
      "Для тех, кто переезжает в Эрзурум по переводу, временному назначению или на долгосрочную работу: апартаменты, в которые можно въехать в течение той же недели, без перевозки мебели, договора аренды и оформления коммунальных услуг.",
    bullets: [
      { title: "Счета включены", text: "Газ, электричество, вода и интернет включены в месячную плату — отдельные подключения не нужны." },
      { title: "Не нужно везти мебель", text: "Бытовая техника, мебель и кухонная утварь уже на месте." },
      { title: "Гибкий срок", text: "Проживание от одного месяца с возможностью продления." },
    ],
    body: [
      {
        heading: "Съём пустой квартиры или апартаменты?",
        text: "Аренда пустой квартиры в Эрзуруме означает залог, договор, подключение коммунальных услуг и расходы на мебель — ничего из этого не окупится, если вы остаётесь на несколько месяцев. При аренде апартаментов на месяц вы платите одну сумму; отопление, интернет и уборка включены, поэтому в конце месяца не будет неожиданных счетов.",
      },
      {
        heading: "Готовы к зиме в Эрзуруме",
        text: "Отопление — один из важнейших факторов комфорта в Эрзуруме. В наших апартаментах газовое отопление и бесперебойная горячая вода 24 часа. Поскольку стоимость отопления включена в месячную плату, вы можете точно планировать бюджет даже зимой.",
      },
      {
        heading: "Корпоративное проживание",
        text: "Мы заключаем договоры на долгосрочное проживание с корпоративным счётом для строительных, проектных и командировочных бригад, с оптовыми ценами для компаний, которым нужно несколько апартаментов.",
      },
    ],
    faqs: [
      { q: "Берётся ли залог при аренде на месяц?", a: "Да, при долгосрочном проживании берётся стандартный залог, который возвращается при выезде, если нет повреждений." },
      { q: "Включены ли счета в стоимость?", a: "Газ, электричество, вода и интернет включены в месячную плату. Необычно высокое потребление рассматривается отдельно." },
      { q: "Выставляете ли вы счета для компаний?", a: "Да. Для корпоративного проживания оформляется счёт и договор." },
    ],
  },
  ar: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "شقق مفروشة للإيجار الشهري في أرضروم",
    intro:
      "لمن ينتقل إلى أرضروم لعمل مؤقت أو تكليف أو وظيفة طويلة الأمد: شقق يمكنكم الانتقال إليها خلال نفس الأسبوع، دون نقل أثاث أو عقد إيجار أو اشتراكات خدمات.",
    bullets: [
      { title: "الفواتير مشمولة", text: "الغاز والكهرباء والماء والإنترنت مشمولة في الأجرة الشهرية — لا حاجة لاشتراكات منفصلة." },
      { title: "لا حاجة لنقل الأثاث", text: "الأجهزة والأثاث وأدوات المطبخ جاهزة في الشقة." },
      { title: "مدة مرنة", text: "الإقامة تبدأ من شهر واحد وقابلة للتمديد." },
    ],
    body: [
      {
        heading: "استئجار شقة فارغة أم شقة مفروشة؟",
        text: "استئجار شقة فارغة في أرضروم يعني تأمين وعقد إيجار واشتراكات خدمات وتكاليف أثاث — لا شيء من ذلك يستحق العناء إذا كنتم ستبقون لأشهر قليلة فقط. عند استئجار شقة شهرياً تدفعون مبلغاً واحداً؛ التدفئة والإنترنت والتنظيف مشمولة، فلا تظهر فاتورة مفاجئة في نهاية الشهر.",
      },
      {
        heading: "جاهزة لشتاء أرضروم",
        text: "التدفئة من أهم عوامل الراحة في أرضروم. شققنا مزودة بنظام تدفئة بالغاز الطبيعي ومياه ساخنة متوفرة على مدار الساعة. وبما أن تكلفة التدفئة مشمولة في الأجرة الشهرية، يمكنكم تخطيط ميزانيتكم بوضوح حتى في الشتاء.",
      },
      {
        heading: "إقامة الشركات",
        text: "نعقد اتفاقيات إقامة طويلة الأمد بفواتير للشركات لفرق المشاريع والتكليفات المؤقتة، مع أسعار جماعية للشركات التي تحتاج أكثر من شقة.",
      },
    ],
    faqs: [
      { q: "هل يُطلب تأمين للإيجار الشهري؟", a: "نعم، يُؤخذ تأمين قياسي للإقامات الطويلة ويُعاد عند المغادرة في حال عدم وجود أضرار." },
      { q: "هل الفواتير مشمولة في السعر؟", a: "الغاز والكهرباء والماء والإنترنت مشمولة في الأجرة الشهرية. يُقيَّم الاستهلاك غير المعتاد بشكل منفصل." },
      { q: "هل تصدرون فواتير للشركات؟", a: "نعم. تُصدر فاتورة ويُعقد عقد للإقامات الخاصة بالشركات." },
    ],
  },
  fa: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "آپارتمان‌های مبله اجاره ماهانه در ارزروم",
    intro:
      "برای کسانی که به دلیل انتقال، مأموریت موقت یا شغل بلندمدت به ارزروم می‌آیند: آپارتمان‌هایی که می‌توانید همان هفته بدون حمل اثاثیه، قرارداد اجاره یا ثبت‌نام قبوض به آن نقل مکان کنید.",
    bullets: [
      { title: "قبوض شامل است", text: "گاز، برق، آب و اینترنت در اجاره ماهانه لحاظ شده — نیازی به اشتراک جداگانه نیست." },
      { title: "نیازی به حمل اثاثیه نیست", text: "لوازم خانگی، مبلمان و وسایل آشپزخانه از قبل آماده است." },
      { title: "مدت انعطاف‌پذیر", text: "اقامت از یک ماه شروع می‌شود و قابل تمدید است." },
    ],
    body: [
      {
        heading: "اجاره آپارتمان خالی یا آپارتمان مبله؟",
        text: "اجاره آپارتمان خالی در ارزروم یعنی ودیعه، قرارداد اجاره، ثبت‌نام قبوض و هزینه اثاثیه — که اگر فقط چند ماه بمانید هیچ‌کدام به صرفه نیست. در اجاره ماهانه آپارتمان مبله فقط یک پرداخت دارید؛ گرمایش، اینترنت و نظافت شامل است، پس در پایان ماه هیچ قبض غافلگیرکننده‌ای نیست.",
      },
      {
        heading: "آماده برای زمستان ارزروم",
        text: "گرمایش یکی از مهم‌ترین امکانات رفاهی در ارزروم است. آپارتمان‌های ما سیستم گرمایش گاز طبیعی و آب گرم ۲۴ ساعته بدون قطعی دارند. چون هزینه گرمایش در اجاره ماهانه لحاظ شده، می‌توانید بودجه خود را حتی در زمستان با اطمینان برنامه‌ریزی کنید.",
      },
      {
        heading: "اقامت سازمانی",
        text: "برای تیم‌های پروژه، ساخت‌وساز و مأموریت موقت، قراردادهای اقامت بلندمدت با صورتحساب سازمانی و قیمت عمده برای شرکت‌هایی که به چند آپارتمان نیاز دارند تنظیم می‌کنیم.",
      },
    ],
    faqs: [
      { q: "آیا برای اجاره ماهانه ودیعه گرفته می‌شود؟", a: "بله، برای اقامت‌های بلندمدت ودیعه استاندارد گرفته می‌شود و در صورت نبود خسارت هنگام خروج بازگردانده می‌شود." },
      { q: "آیا قبوض در قیمت لحاظ شده است؟", a: "گاز، برق، آب و اینترنت در اجاره ماهانه لحاظ شده است. مصرف غیرعادی جداگانه بررسی می‌شود." },
      { q: "آیا صورتحساب سازمانی صادر می‌کنید؟", a: "بله. برای اقامت‌های سازمانی صورتحساب صادر و قرارداد تنظیم می‌شود." },
    ],
  },
  de: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Monatliche möblierte Apartments zur Miete in Erzurum",
    intro:
      "Für alle, die aus beruflichen Gründen, einer vorübergehenden Versetzung oder einer langfristigen Stelle nach Erzurum ziehen: Apartments, in die Sie innerhalb derselben Woche einziehen können — ohne Möbeltransport, Mietvertrag oder Anmeldung bei Versorgungsunternehmen.",
    bullets: [
      { title: "Nebenkosten inklusive", text: "Gas, Strom, Wasser und Internet sind im Monatspreis enthalten — keine separaten Anmeldungen nötig." },
      { title: "Kein Möbeltransport nötig", text: "Geräte, Möbel und Küchenutensilien sind bereits vorhanden." },
      { title: "Flexible Laufzeit", text: "Aufenthalte beginnen ab einem Monat und können verlängert werden." },
    ],
    body: [
      { heading: "Leere Wohnung oder möbliertes Apartment mieten?", text: "Die Miete einer leeren Wohnung in Erzurum bedeutet Kaution, Mietvertrag, Anmeldung bei Versorgungsunternehmen und Möbelkosten — nichts davon lohnt sich, wenn Sie nur wenige Monate bleiben. Bei einem monatlichen Apartment zahlen Sie eine Summe; Heizung, Internet und Reinigung sind inbegriffen, sodass am Monatsende keine überraschende Rechnung kommt." },
      { heading: "Bereit für den Erzurum-Winter", text: "Heizung ist einer der wichtigsten Komfortfaktoren in Erzurum. Unsere Apartments verfügen über Erdgasheizung und ununterbrochenes Warmwasser rund um die Uhr. Da die Heizkosten im Monatspreis enthalten sind, können Sie Ihr Budget auch im Winter mit Sicherheit planen." },
      { heading: "Firmenaufenthalte", text: "Wir arrangieren langfristige Aufenthaltsverträge mit Firmenrechnung für Bau-, Projekt- und Entsendeteams, mit Mengenpreisen für Unternehmen, die mehrere Apartments benötigen." },
    ],
    faqs: [
      { q: "Ist bei monatlicher Miete eine Kaution erforderlich?", a: "Ja, bei langfristigen Aufenthalten wird eine übliche Kaution erhoben, die bei Auszug ohne Schäden zurückerstattet wird." },
      { q: "Sind die Nebenkosten im Preis enthalten?", a: "Gas, Strom, Wasser und Internet sind im Monatspreis enthalten. Ungewöhnlich hoher Verbrauch wird gesondert bewertet." },
      { q: "Stellen Sie Firmenrechnungen aus?", a: "Ja. Für Firmenaufenthalte wird eine Rechnung ausgestellt und ein Vertrag vereinbart." },
    ],
  },
  fr: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Appartements meublés à louer au mois à Erzurum",
    intro:
      "Pour ceux qui s'installent à Erzurum pour une mutation, une affectation temporaire ou un emploi de longue durée : des appartements dans lesquels vous pouvez emménager dans la même semaine, sans transport de meubles, sans bail et sans abonnements aux services publics.",
    bullets: [
      { title: "Charges incluses", text: "Le gaz, l'électricité, l'eau et l'internet sont inclus dans le loyer mensuel — aucun abonnement séparé n'est nécessaire." },
      { title: "Pas de meubles à déplacer", text: "Électroménager, mobilier et ustensiles de cuisine sont déjà en place." },
      { title: "Durée flexible", text: "Les séjours commencent à partir d'un mois et peuvent être prolongés." },
    ],
    body: [
      { heading: "Louer un appartement vide ou un appartement meublé ?", text: "Louer un appartement vide à Erzurum implique une caution, un bail, des abonnements aux services publics et des frais de mobilier — rien de tout cela n'en vaut la peine si vous ne restez que quelques mois. Avec un appartement meublé au mois, vous effectuez un seul paiement ; le chauffage, l'internet et le ménage sont inclus, donc pas de facture surprise en fin de mois." },
      { heading: "Prêt pour l'hiver d'Erzurum", text: "Le chauffage est l'un des conforts les plus importants à Erzurum. Nos appartements disposent d'un chauffage au gaz naturel et d'eau chaude ininterrompue 24h/24. Le coût du chauffage étant inclus dans le loyer mensuel, vous pouvez planifier votre budget avec certitude même en hiver." },
      { heading: "Séjours pour entreprises", text: "Nous organisons des contrats de séjour longue durée avec facturation d'entreprise pour les équipes de construction, de projet et d'affectation temporaire, avec des tarifs de groupe pour les entreprises ayant besoin de plusieurs appartements." },
    ],
    faqs: [
      { q: "Une caution est-elle requise pour la location mensuelle ?", a: "Oui, une caution standard est demandée pour les séjours de longue durée et remboursée au départ en l'absence de dommages." },
      { q: "Les charges sont-elles incluses dans le prix ?", a: "Le gaz, l'électricité, l'eau et l'internet sont inclus dans le loyer mensuel. Une consommation anormalement élevée est évaluée séparément." },
      { q: "Émettez-vous des factures d'entreprise ?", a: "Oui. Pour les séjours d'entreprise, une facture est émise et un contrat est établi." },
    ],
  },
  es: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Apartamentos amueblados en alquiler mensual en Erzurum",
    intro:
      "Para quienes se trasladan a Erzurum por un traslado laboral, una asignación temporal o un empleo a largo plazo: apartamentos a los que puede mudarse en la misma semana, sin transportar muebles, sin contrato de alquiler y sin darse de alta en servicios públicos.",
    bullets: [
      { title: "Gastos incluidos", text: "El gas, la electricidad, el agua y el internet están incluidos en la renta mensual — no se necesitan altas por separado." },
      { title: "Sin muebles que transportar", text: "Electrodomésticos, muebles y utensilios de cocina ya están instalados." },
      { title: "Duración flexible", text: "Las estancias comienzan desde un mes y pueden extenderse." },
    ],
    body: [
      { heading: "¿Alquilar un piso vacío o un apartamento amueblado?", text: "Alquilar un piso vacío en Erzurum implica depósito, contrato de alquiler, altas de servicios públicos y gastos de mobiliario — nada de eso vale la pena si solo se queda unos meses. Con un apartamento amueblado mensual, hace un solo pago; la calefacción, el internet y la limpieza están incluidos, así que no hay factura sorpresa a fin de mes." },
      { heading: "Listo para el invierno de Erzurum", text: "La calefacción es una de las comodidades más importantes en Erzurum. Nuestros apartamentos cuentan con calefacción de gas natural y agua caliente ininterrumpida las 24 horas. Como el costo de la calefacción está incluido en la renta mensual, puede planificar su presupuesto con certeza incluso en invierno." },
      { heading: "Estancias corporativas", text: "Organizamos contratos de estancia a largo plazo con facturación corporativa para equipos de construcción, proyectos y asignaciones temporales, con precios por volumen para empresas que necesitan varios apartamentos." },
    ],
    faqs: [
      { q: "¿Se requiere depósito para el alquiler mensual?", a: "Sí, se cobra un depósito estándar para estancias largas, que se reembolsa al salir si no hay daños." },
      { q: "¿Los gastos están incluidos en el precio?", a: "El gas, la electricidad, el agua y el internet están incluidos en la renta mensual. Un consumo inusualmente alto se evalúa por separado." },
      { q: "¿Emiten facturas corporativas?", a: "Sí. Para estancias corporativas se emite factura y se establece un contrato." },
    ],
  },
  az: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "Ərzurumda aylıq icarəyə mebelli mənzillər",
    intro:
      "Köçürülmə, müvəqqəti ezamiyyət və ya uzunmüddətli iş səbəbilə Ərzuruma gələnlər üçün: mebel daşımadan, icarə müqaviləsi olmadan və kommunal xidmətlərə qeydiyyat olmadan eyni həftə köçə biləcəyiniz mənzillər.",
    bullets: [
      { title: "Kommunal xərclər daxildir", text: "Qaz, elektrik, su və internet aylıq icarə haqqına daxildir — ayrıca abunə lazım deyil." },
      { title: "Mebel daşımağa ehtiyac yoxdur", text: "Məişət texnikası, mebel və mətbəx ləvazimatları artıq hazırdır." },
      { title: "Çevik müddət", text: "Qalma bir aydan başlayır və uzadıla bilər." },
    ],
    body: [
      { heading: "Boş mənzil yoxsa mebelli mənzil icarəsi?", text: "Ərzurumda boş mənzil icarəsi girov, icarə müqaviləsi, kommunal xidmətlərə qeydiyyat və mebel xərcləri deməkdir — bir neçə ay qalacaqsınızsa bunların heç biri sərfəli deyil. Aylıq mebelli mənzil icarəsində bir ödəniş edirsiniz; istilik, internet və təmizlik daxildir, ay sonunda gözlənilməz hesab olmur." },
      { heading: "Ərzurum qışına hazır", text: "İstilik Ərzurumdakı ən vacib rahatlıq amillərindən biridir. Mənzillərimizdə təbii qaz istiliyi və fasiləsiz 24 saat isti su var. İstilik xərci aylıq icarə haqqına daxil olduğundan, büdcənizi qışda belə əminliklə planlaşdıra bilərsiniz." },
      { heading: "Korporativ qalma", text: "Tikinti, layihə və müvəqqəti ezamiyyət komandaları üçün korporativ faktura ilə uzunmüddətli qalma müqavilələri təşkil edirik, bir neçə mənzilə ehtiyacı olan şirkətlər üçün topdan qiymətlərlə." },
    ],
    faqs: [
      { q: "Aylıq icarə üçün girov tələb olunurmu?", a: "Bəli, uzunmüddətli qalmalar üçün standart girov alınır və çıxışda zərər olmadıqda geri qaytarılır." },
      { q: "Kommunal xərclər qiymətə daxildirmi?", a: "Qaz, elektrik, su və internet aylıq icarə haqqına daxildir. Qeyri-adi yüksək istehlak ayrıca qiymətləndirilir." },
      { q: "Korporativ faktura verirsinizmi?", a: "Bəli. Korporativ qalmalar üçün faktura verilir və müqavilə bağlanır." },
    ],
  },
  ka: {
    path: "/aylik-kiralik-apart-erzurum",
    h1: "ყოველთვიური ავეჯით აღჭურვილი ბინების გაქირავება ერზურუმში",
    intro:
      "მათთვის, ვინც ერზურუმში გადადის გადაყვანის, დროებითი მივლინების ან გრძელვადიანი სამუშაოს გამო: ბინები, სადაც შეგიძლიათ იმავე კვირაში გადახვიდეთ — ავეჯის ტრანსპორტირების, ქირავნობის ხელშეკრულებისა და კომუნალური სერვისების რეგისტრაციის გარეშე.",
    bullets: [
      { title: "კომუნალური გადასახადები შედის", text: "გაზი, ელექტროენერგია, წყალი და ინტერნეტი შედის ყოველთვიურ ქირაში — ცალკე რეგისტრაცია არ არის საჭირო." },
      { title: "ავეჯის ტრანსპორტირება არ არის საჭირო", text: "ტექნიკა, ავეჯი და სამზარეულოს ჭურჭელი უკვე მზადაა." },
      { title: "მოქნილი ვადა", text: "ცხოვრება იწყება ერთი თვიდან და შეიძლება გაგრძელდეს." },
    ],
    body: [
      { heading: "ცარიელი ბინა თუ ავეჯით აღჭურვილი ბინის ქირავნობა?", text: "ერზურუმში ცარიელი ბინის ქირავნობა ნიშნავს გირაოს, ქირავნობის ხელშეკრულებას, კომუნალური სერვისების რეგისტრაციასა და ავეჯის ხარჯებს — არცერთი მათგანი არ ღირს, თუ რამდენიმე თვით რჩებით. ყოველთვიური ავეჯით აღჭურვილი ბინით თქვენ იხდით ერთ თანხას; გათბობა, ინტერნეტი და დასუფთავება შედის, ასე რომ თვის ბოლოს არ იქნება მოულოდნელი გადასახადი." },
      { heading: "მზადაა ერზურუმის ზამთრისთვის", text: "გათბობა ერზურუმში ერთ-ერთი ყველაზე მნიშვნელოვანი კომფორტია. ჩვენს ბინებს აქვთ ბუნებრივი აირის გათბობა და შეუფერხებელი 24-საათიანი ცხელი წყალი. რადგან გათბობის ღირებულება შედის ყოველთვიურ ქირაში, შეგიძლიათ დაგეგმოთ თქვენი ბიუჯეტი დარწმუნებით ზამთარშიც კი." },
      { heading: "კორპორატიული ცხოვრება", text: "ვაწყობთ გრძელვადიანი ცხოვრების ხელშეკრულებებს კორპორატიული ინვოისით სამშენებლო, საპროექტო და დროებითი მივლინების გუნდებისთვის, საბითუმო ფასებით კომპანიებისთვის, რომლებსაც რამდენიმე ბინა სჭირდებათ." },
    ],
    faqs: [
      { q: "საჭიროა თუ არა გირაო ყოველთვიური გაქირავებისთვის?", a: "დიახ, გრძელვადიანი ცხოვრებისთვის აღებულია სტანდარტული გირაო, რომელიც წასვლისას ზიანის არარსებობის შემთხვევაში ბრუნდება." },
      { q: "შედის თუ არა კომუნალური გადასახადები ფასში?", a: "გაზი, ელექტროენერგია, წყალი და ინტერნეტი შედის ყოველთვიურ ქირაში. უჩვეულოდ მაღალი მოხმარება ცალკე ფასდება." },
      { q: "გასცემთ თუ არა კორპორატიულ ინვოისებს?", a: "დიახ. კორპორატიული ცხოვრებისთვის გაიცემა ინვოისი და დგება ხელშეკრულება." },
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
