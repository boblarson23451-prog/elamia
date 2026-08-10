/**
 * Legal pages content for ELALAMIA.
 *
 * ⚠️ IMPORTANT — READ BEFORE PUBLISHING
 *
 * These documents are TEMPLATES drafted around the disclosure obligations of
 * Algerian Law n° 18-05 of 10 May 2018 on electronic commerce, Law n° 09-03 on
 * consumer protection, and Law n° 18-07 on personal data protection. They are
 * NOT legal advice and have not been reviewed by a lawyer. Before you publish
 * them you must:
 *
 *   1. Replace every value in COMPANY below with your real registered details.
 *      Law 18-05 requires an e-fournisseur to publish its identity, registre de
 *      commerce number, NIF, address, phone and email. Publishing a site
 *      without them exposes you to fines.
 *   2. Have an Algerian lawyer review the final text, especially the returns
 *      and refund terms (arts. 22-23) and anything touching payment.
 *   3. Check the prohibited-goods list still matches your catalogue.
 *
 * Any field left as "À COMPLÉTER" will render visibly as unfinished on the
 * public site — that is deliberate, so nothing ships half-filled by accident.
 */

export const COMPANY = {
  legalName: "À COMPLÉTER — dénomination sociale",
  tradeName: "ELALAMIA",
  legalForm: "À COMPLÉTER — ex. EURL / SARL / auto-entrepreneur",
  address: "À COMPLÉTER — adresse complète du siège",
  wilaya: "À COMPLÉTER",
  rc: "À COMPLÉTER — n° registre de commerce",
  nif: "À COMPLÉTER — n° d'identification fiscale",
  nis: "À COMPLÉTER — n° d'identification statistique (si applicable)",
  activityCode: "607.074",
  phone: "À COMPLÉTER",
  email: "À COMPLÉTER — ex. contact@elalamia.dz",
  hostingProvider: "À COMPLÉTER — hébergeur et pays d'hébergement",
  director: "À COMPLÉTER — nom du directeur de la publication",
};

export const LEGAL_DOCS = {
  "mentions-legales": {
    title_fr: "Mentions légales",
    title_ar: "معلومات قانونية",
    updated: "2026-08-10",
    sections: [
      {
        h_fr: "Identification de l'e-fournisseur",
        h_ar: "تعريف المورد الإلكتروني",
        body_fr: `Conformément à la loi n° 18-05 du 10 mai 2018 relative au commerce électronique, les informations suivantes sont portées à la connaissance de l'e-consommateur :

• Dénomination : {legalName} (nom commercial : {tradeName})
• Forme juridique : {legalForm}
• Siège social : {address}, wilaya de {wilaya}
• Registre de commerce n° : {rc}
• Code d'activité : {activityCode} (commerce électronique)
• NIF : {nif}
• NIS : {nis}
• Téléphone : {phone}
• E-mail : {email}
• Directeur de la publication : {director}
• Hébergement du site : {hostingProvider}`,
        body_ar: `طبقاً للقانون رقم 18-05 المؤرخ في 10 ماي 2018 المتعلق بالتجارة الإلكترونية، تُوضع المعلومات التالية تحت تصرف المستهلك الإلكتروني:

• التسمية: {legalName} (الاسم التجاري: {tradeName})
• الشكل القانوني: {legalForm}
• المقر الاجتماعي: {address}، ولاية {wilaya}
• رقم السجل التجاري: {rc}
• رمز النشاط: {activityCode} (التجارة الإلكترونية)
• رقم التعريف الجبائي: {nif}
• رقم التعريف الإحصائي: {nis}
• الهاتف: {phone}
• البريد الإلكتروني: {email}
• مدير النشر: {director}
• استضافة الموقع: {hostingProvider}`,
      },
      {
        h_fr: "Propriété intellectuelle",
        h_ar: "الملكية الفكرية",
        body_fr: `L'ensemble des éléments de ce site (marque, textes, mise en page) est protégé. Les visuels et descriptifs des produits peuvent appartenir aux fournisseurs concernés et sont utilisés dans le cadre de la relation commerciale avec ceux-ci. Toute reproduction non autorisée est interdite.`,
        body_ar: `جميع عناصر هذا الموقع (العلامة، النصوص، التصميم) محمية. قد تعود صور ووصف المنتجات إلى المورّدين المعنيين وتُستعمل في إطار العلاقة التجارية معهم. يُمنع أي استنساخ غير مرخّص.`,
      },
      {
        h_fr: "Signalement",
        h_ar: "الإبلاغ",
        body_fr: `Pour signaler un contenu illicite ou une erreur, écrivez à {email}.`,
        body_ar: `للإبلاغ عن محتوى غير قانوني أو عن خطأ، راسلونا على {email}.`,
      },
    ],
  },

  cgv: {
    title_fr: "Conditions générales de vente",
    title_ar: "الشروط العامة للبيع",
    updated: "2026-08-10",
    sections: [
      {
        h_fr: "1. Objet et champ d'application",
        h_ar: "1. الموضوع ومجال التطبيق",
        body_fr: `Les présentes conditions générales régissent les ventes conclues sur {tradeName} entre l'e-fournisseur et l'e-consommateur, conformément à la loi n° 18-05 relative au commerce électronique et à la loi n° 09-03 relative à la protection du consommateur. Toute commande implique l'acceptation sans réserve des présentes conditions.`,
        body_ar: `تحكم هذه الشروط العامة عمليات البيع المبرمة على {tradeName} بين المورد الإلكتروني والمستهلك الإلكتروني، طبقاً للقانون 18-05 المتعلق بالتجارة الإلكترونية والقانون 09-03 المتعلق بحماية المستهلك. كل طلبية تعني القبول غير المتحفظ لهذه الشروط.`,
      },
      {
        h_fr: "2. Produits",
        h_ar: "2. المنتجات",
        body_fr: `Chaque produit fait l'objet d'un descriptif indiquant ses caractéristiques essentielles. Les photographies sont indicatives et peuvent présenter de légères différences avec le produit livré. Les offres sont valables dans la limite des stocks disponibles.

Conformément à la loi 18-05, ne peuvent faire l'objet de transactions en ligne : les jeux de hasard, paris et loteries, les boissons alcoolisées et le tabac, les produits pharmaceutiques, ainsi que tout produit portant atteinte aux droits de propriété intellectuelle, industrielle ou commerciale.`,
        body_ar: `يخضع كل منتج لوصف يبيّن خصائصه الأساسية. الصور إرشادية وقد تختلف قليلاً عن المنتج المُسلَّم. تبقى العروض سارية في حدود المخزون المتوفر.

طبقاً للقانون 18-05، لا يمكن أن تكون محل معاملات إلكترونية: ألعاب الحظ والرهانات واليانصيب، المشروبات الكحولية والتبغ، المنتجات الصيدلانية، وكل منتج يمسّ بحقوق الملكية الفكرية أو الصناعية أو التجارية.`,
      },
      {
        h_fr: "3. Prix",
        h_ar: "3. الأسعار",
        body_fr: `Les prix sont affichés en dinars algériens (DA), toutes taxes comprises. Les frais de livraison sont calculés selon le poids de la commande, la wilaya de destination et le mode de livraison choisi ; ils sont affichés avant la validation définitive de la commande. Le montant total à payer est récapitulé avant confirmation.`,
        body_ar: `تُعرض الأسعار بالدينار الجزائري (دج)، مع احتساب كل الرسوم. تُحسب مصاريف التوصيل حسب وزن الطلبية وولاية الوجهة وطريقة التوصيل المختارة، وتُعرض قبل التأكيد النهائي للطلبية. يُلخَّص المبلغ الإجمالي الواجب دفعه قبل التأكيد.`,
      },
      {
        h_fr: "4. Commande",
        h_ar: "4. الطلبية",
        body_fr: `Le processus de commande comporte : la sélection des articles, la vérification du panier, la saisie des informations de livraison, le choix du mode de livraison et de paiement, puis la confirmation. L'e-consommateur peut vérifier et corriger sa commande avant de la valider. Un récapitulatif est accessible dans son espace « Mes commandes ».`,
        body_ar: `تتضمّن عملية الطلب: اختيار المنتجات، مراجعة السلة، إدخال معلومات التوصيل، اختيار طريقة التوصيل والدفع، ثم التأكيد. يمكن للمستهلك مراجعة وتصحيح طلبيته قبل التأكيد. يتوفّر ملخّص في فضاء «طلباتي».`,
      },
      {
        h_fr: "5. Paiement",
        h_ar: "5. الدفع",
        body_fr: `Les moyens de paiement proposés sont indiqués lors de la commande. Le paiement en ligne s'effectue via une plateforme de paiement électronique agréée. La commande n'est traitée qu'après confirmation effective du paiement, sauf en cas de paiement à la livraison lorsque celui-ci est proposé.`,
        body_ar: `تُبيَّن وسائل الدفع المتاحة عند الطلب. يتم الدفع الإلكتروني عبر منصة دفع إلكتروني معتمدة. لا تُعالَج الطلبية إلا بعد التأكيد الفعلي للدفع، باستثناء حالة الدفع عند الاستلام عندما تكون متاحة.`,
      },
      {
        h_fr: "6. Livraison",
        h_ar: "6. التوصيل",
        body_fr: `La livraison est assurée dans les 58 wilayas, à domicile ou en point de retrait selon le choix effectué. Les délais indicatifs sont précisés pour chaque mode de livraison avant la validation de la commande. Les délais courent à compter de la confirmation de la commande et s'entendent en jours ouvrables. En cas de retard important, l'e-consommateur est informé et peut demander l'annulation de sa commande.`,
        body_ar: `يتم التوصيل عبر 58 ولاية، إلى المنزل أو إلى نقطة استلام حسب الاختيار. تُحدَّد الآجال الإرشادية لكل طريقة توصيل قبل تأكيد الطلبية. تُحتسب الآجال ابتداءً من تأكيد الطلبية وتُفهم بأيام العمل. في حال تأخّر معتبر، يُعلَم المستهلك ويمكنه طلب إلغاء طلبيته.`,
      },
      {
        h_fr: "7. Rétractation, retour et remboursement",
        h_ar: "7. التراجع والإرجاع والاسترجاع",
        body_fr: `Les modalités détaillées figurent dans notre Politique de retour, qui fait partie intégrante des présentes conditions.`,
        body_ar: `ترد الكيفيات المفصّلة في سياسة الإرجاع الخاصة بنا، والتي تُعدّ جزءاً لا يتجزأ من هذه الشروط.`,
      },
      {
        h_fr: "8. Garantie et réclamations",
        h_ar: "8. الضمان والشكاوى",
        body_fr: `Les produits bénéficient de la garantie légale prévue par la réglementation en vigueur contre les vices cachés et les défauts de conformité. Toute réclamation peut être adressée à {email} ou au {phone}.`,
        body_ar: `تستفيد المنتجات من الضمان القانوني المنصوص عليه في التنظيم الساري ضد العيوب الخفية وعدم المطابقة. يمكن توجيه أي شكوى إلى {email} أو على الرقم {phone}.`,
      },
      {
        h_fr: "9. Données personnelles",
        h_ar: "9. المعطيات الشخصية",
        body_fr: `Le traitement des données est décrit dans notre Politique de confidentialité, conformément à la loi n° 18-07 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.`,
        body_ar: `تُوصف معالجة المعطيات في سياسة الخصوصية، طبقاً للقانون 18-07 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.`,
      },
      {
        h_fr: "10. Droit applicable et litiges",
        h_ar: "10. القانون المطبق والنزاعات",
        body_fr: `Les présentes conditions sont soumises au droit algérien. En cas de litige, une solution amiable sera recherchée en priorité. À défaut, les juridictions algériennes compétentes seront saisies.`,
        body_ar: `تخضع هذه الشروط للقانون الجزائري. في حال نزاع، يُبحث أولاً عن حلّ ودّي. وفي حال تعذّر ذلك، تُرفع القضية أمام الجهات القضائية الجزائرية المختصة.`,
      },
    ],
  },

  retours: {
    title_fr: "Politique de retour et de remboursement",
    title_ar: "سياسة الإرجاع والاسترجاع",
    updated: "2026-08-10",
    sections: [
      {
        h_fr: "Droit de retour",
        h_ar: "حق الإرجاع",
        body_fr: `Conformément aux articles 22 et 23 de la loi n° 18-05, l'e-consommateur peut retourner un produit non conforme à la commande, défectueux ou endommagé.

⚠️ À COMPLÉTER : indiquez ici le délai exact de retour que vous appliquez (à compter de la réception), et faites-le valider par votre conseil juridique afin qu'il soit conforme aux délais légaux en vigueur.`,
        body_ar: `طبقاً للمادتين 22 و23 من القانون 18-05، يمكن للمستهلك الإلكتروني إرجاع منتج غير مطابق للطلبية أو معيب أو متضرّر.

⚠️ يُستكمل: حدّدوا هنا أجل الإرجاع الدقيق المطبَّق (ابتداءً من الاستلام)، وتأكّدوا من مطابقته للآجال القانونية السارية عبر مستشاركم القانوني.`,
      },
      {
        h_fr: "Conditions",
        h_ar: "الشروط",
        body_fr: `Le produit doit être retourné dans son état d'origine, complet, non utilisé, avec son emballage et ses accessoires. Les produits personnalisés, l'hygiène et les sous-vêtements peuvent être exclus du retour lorsque la réglementation le permet.`,
        body_ar: `يجب إرجاع المنتج في حالته الأصلية، كاملاً، غير مستعمل، مع تغليفه وملحقاته. يمكن استثناء المنتجات المخصّصة ومنتجات النظافة والملابس الداخلية من الإرجاع عندما يسمح التنظيم بذلك.`,
      },
      {
        h_fr: "Procédure",
        h_ar: "الإجراء",
        body_fr: `1. Contactez-nous à {email} ou au {phone} en indiquant votre numéro de commande et le motif.
2. Nous vous confirmons la prise en charge et l'adresse de retour.
3. Après réception et vérification du produit, le remboursement ou l'échange est traité.`,
        body_ar: `1. اتصلوا بنا على {email} أو على {phone} مع ذكر رقم الطلبية والسبب.
2. نؤكّد لكم التكفّل وعنوان الإرجاع.
3. بعد استلام المنتج والتحقّق منه، تُعالَج عملية الاسترجاع أو التبديل.`,
      },
      {
        h_fr: "Frais de retour",
        h_ar: "مصاريف الإرجاع",
        body_fr: `Lorsque le retour est dû à une erreur de notre part (produit non conforme, défectueux ou endommagé), les frais de retour sont à notre charge.

⚠️ À COMPLÉTER : précisez qui supporte les frais dans les autres cas.`,
        body_ar: `عندما يكون الإرجاع بسبب خطأ من جانبنا (منتج غير مطابق أو معيب أو متضرّر)، تكون مصاريف الإرجاع على عاتقنا.

⚠️ يُستكمل: حدّدوا من يتحمّل المصاريف في الحالات الأخرى.`,
      },
      {
        h_fr: "Remboursement",
        h_ar: "الاسترجاع",
        body_fr: `Le remboursement est effectué par le même moyen que celui utilisé lors du paiement, sauf accord contraire.

⚠️ À COMPLÉTER : indiquez le délai de remboursement que vous vous engagez à respecter.`,
        body_ar: `يتم الاسترجاع بنفس وسيلة الدفع المستعملة، ما لم يُتّفق على خلاف ذلك.

⚠️ يُستكمل: حدّدوا أجل الاسترجاع الذي تلتزمون به.`,
      },
    ],
  },

  confidentialite: {
    title_fr: "Politique de confidentialité",
    title_ar: "سياسة الخصوصية",
    updated: "2026-08-10",
    sections: [
      {
        h_fr: "Responsable du traitement",
        h_ar: "المسؤول عن المعالجة",
        body_fr: `{legalName}, {address}, joignable à {email}. Le traitement est effectué conformément à la loi n° 18-07 du 10 juin 2018 relative à la protection des personnes physiques dans le traitement des données à caractère personnel.`,
        body_ar: `{legalName}، {address}، يمكن الاتصال على {email}. تتم المعالجة طبقاً للقانون 18-07 المؤرخ في 10 جوان 2018 المتعلق بحماية الأشخاص الطبيعيين في مجال معالجة المعطيات ذات الطابع الشخصي.`,
      },
      {
        h_fr: "Données collectées et finalités",
        h_ar: "المعطيات المجمَّعة والغايات",
        body_fr: `Nous collectons : nom, e-mail, téléphone, wilaya et adresse de livraison, historique de commandes, et les données techniques strictement nécessaires au fonctionnement du site (session de connexion).

Ces données servent exclusivement à : créer et gérer votre compte, traiter et livrer vos commandes, assurer le service après-vente, et respecter nos obligations légales et comptables.`,
        body_ar: `نجمع: الاسم، البريد الإلكتروني، الهاتف، الولاية وعنوان التوصيل، سجلّ الطلبيات، والمعطيات التقنية الضرورية حصراً لاشتغال الموقع (جلسة الاتصال).

تُستعمل هذه المعطيات حصراً من أجل: إنشاء وتسيير حسابكم، معالجة وتوصيل طلبياتكم، ضمان خدمة ما بعد البيع، واحترام التزاماتنا القانونية والمحاسبية.`,
      },
      {
        h_fr: "Destinataires",
        h_ar: "المرسل إليهم",
        body_fr: `Vos données de livraison sont transmises au transporteur ou au point de retrait concerné, et au vendeur partenaire lorsque votre commande porte sur ses produits, uniquement dans la mesure nécessaire à l'exécution de la commande. Aucune donnée n'est vendue à des tiers.`,
        body_ar: `تُنقل معطيات التوصيل الخاصة بكم إلى الناقل أو نقطة الاستلام المعنية، وإلى البائع الشريك عندما تخصّ طلبيتكم منتجاته، وذلك فقط في الحدود الضرورية لتنفيذ الطلبية. لا تُباع أي معطيات لأطراف ثالثة.`,
      },
      {
        h_fr: "Conservation",
        h_ar: "مدة الحفظ",
        body_fr: `Les données de commande sont conservées pendant la durée requise par les obligations légales et comptables. Les données de compte sont conservées tant que le compte est actif.`,
        body_ar: `تُحفظ معطيات الطلبيات طيلة المدة التي تفرضها الالتزامات القانونية والمحاسبية. تُحفظ معطيات الحساب ما دام الحساب نشطاً.`,
      },
      {
        h_fr: "Vos droits",
        h_ar: "حقوقكم",
        body_fr: `Vous disposez d'un droit d'accès, de rectification et d'effacement de vos données, ainsi que d'un droit d'opposition dans les conditions prévues par la loi 18-07. Pour l'exercer, écrivez à {email}.`,
        body_ar: `لكم حق الاطلاع والتصحيح والمحو لمعطياتكم، وكذا حق الاعتراض ضمن الشروط المنصوص عليها في القانون 18-07. لممارسة ذلك، راسلونا على {email}.`,
      },
      {
        h_fr: "Cookies et stockage local",
        h_ar: "ملفات الارتباط والتخزين المحلي",
        body_fr: `Le site utilise un cookie de session strictement nécessaire pour vous maintenir connecté, ainsi qu'un stockage local pour mémoriser votre préférence de langue. Aucun cookie publicitaire ou de traçage tiers n'est déposé.`,
        body_ar: `يستعمل الموقع ملف ارتباط خاص بالجلسة ضروري حصراً لإبقائكم متصلين، وكذا تخزيناً محلياً لحفظ تفضيل اللغة. لا تُودع أي ملفات ارتباط إشهارية أو تتبّعية تابعة لأطراف ثالثة.`,
      },
    ],
  },
};

/** Fills {placeholders} from COMPANY and flags anything still incomplete. */
export function renderTemplate(text) {
  return text.replace(/\{(\w+)\}/g, (m, key) => COMPANY[key] ?? m);
}

export function hasIncompleteFields() {
  return Object.values(COMPANY).some((v) => String(v).includes("À COMPLÉTER"));
}
