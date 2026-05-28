/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SurvivalGuide {
  id: string;
  category: 'first_aid' | 'shelling' | 'natural_disaster' | 'essential';
  title: Record<string, string>;
  steps: Record<string, string[]>;
  warning?: Record<string, string>;
}

export const EMERGENCY_CONTACTS: { label: string; number: string; description: string }[] = [
  { label: 'General Emergency Rescue', number: '112', description: 'Works on all networks even without raw SIM service' },
  { label: 'State Civil Medical Service', number: '103', description: 'Triage doctors and ambulance dispatch' },
  { label: 'Tactical Fire & Demining Brigade', number: '101', description: 'Unexploded ordnance and fire rescue' },
  { label: 'WarAid Volunteer Network', number: 'Radio Ch 12 (446.09 MHz)', description: 'Decentralized local volunteer mesh' },
];

export const SURVIVAL_GUIDES: SurvivalGuide[] = [
  {
    id: 'severe_bleeding',
    category: 'first_aid',
    title: {
      en: 'Pressure & Tourniquet for Severe Bleeding',
      ta: 'கடுமையான இரத்தப்போக்குக்கு அழுத்தக் கட்டு',
      hi: 'गंभीर रक्तस्राव के लिए दबाव और टूर्निकेट',
      uk: 'Накладання джгута при сильній кровотечі',
      ar: 'الضغط والضغط لربط النزيف الحاد'
    },
    steps: {
      en: [
        'Apply direct, heavy physical pressure onto the wound using a clean thick dressing or cloth.',
        'If bleeding is in an arm or leg and pressure does not stop it, apply a TOURNIQUET 2–3 inches above the wound (never directly on a joint).',
        'Tighten the tourniquet windlass until bleeding stops completely and the distal pulse is gone.',
        'Mark the EXACT time of tourniquet application on the patient\'s forehead (e.g., "14:30 T").',
        'Keep the limb elevated and do NOT loosen the tourniquet once placed.'
      ],
      ta: [
        'சுத்தமான அடர்த்தியான துணியைப் பயன்படுத்தி காயத்தின் மீது நேரடியாக பலமான அழுத்தத்தை கொடுக்கவும்.',
        'இரத்தப்போக்கு நிற்கவில்லை என்றால், காயத்திற்கு 2-3 அங்குலங்கள் மேலே ஒரு இறுக்கக் கட்டை (டோர்னிக்கெட்) கட்டவும்.',
        'இரத்தப்போக்கு முற்றிலும் நிற்கும் வரை கட்டை இறுக்கவும்.',
        'கட்டப்பட்ட துல்லியமான நேரத்தை நோயாளியின் நெற்றியில் குறிக்கவும் (உதாரணம்: "14:30 T").'
      ],
      hi: [
        'साफ और मोटे कपड़े का उपयोग करके घाव पर सीधा, भारी शारीरिक दबाव डालें।',
        'यदि रक्तस्राव हाथ या पैर में है और दबाव से कम नहीं होता, तो घाव से 2-3 इंच ऊपर टूर्निकेट लगाएं।',
        'टूर्निकेट को तब तक कसें जब तक रक्तस्राव पूरी तरह से बंद न हो जाए।',
        'टूर्निकेट लगाने का सटीक समय मरीज के माथे पर स्पष्ट रूप से लिखें (जैसे: "14:30 T")।'
      ],
      uk: [
        'Накладіть прямий, сильний тиск на рану за допомогою чистої товстої пов\'язки або тканини.',
        'Якщо кровотеча з кінцівки не зупиняється тиском, накладіть ДЖГУТ (турнікет) на 5-7 см вище рани (ніколи не на суглоб).',
        'Затягуйте вороток турнікета, поки кровотеча не зупиниться повністю.',
        'Обов\'язково запишіть ТОЧНИЙ час накладання джгута на лобі постраждалого (наприклад, "14:30 T").',
        'Не послаблюйте джгут самостійно після накладання!'
      ],
      ar: [
        'اضغط بقوة وبشكل مباشر على الجرح باستخدام ضمادة أو قماش نظيف وسميك.',
        'إذا لم يتوقف النزيف، ارْبط عُصابة طبية (تورتيكيت) على بُعد ٢-٣ بوصات فوق الجرح (ليس على المفصل).',
        'أحكم ربط العصابة حتى يتوقف تدفق الدم تماماً.',
        'اكتب وقت وضع العصابة بالدقة على جبهة المصاب (مثال: "١٤:٣٠ ت").'
      ]
    },
    warning: {
      en: '⚠️ WARNING: Placing a tourniquet too loosely can increase bleeding by stopping venous return but not arterial flow. Tighten fully!',
      uk: '⚠️ УВАГА: Слабке накладання турнікета може збільшити втрату крові, перекривши лише венозний відтік. Затягуйте максимально!',
      ta: '⚠️ எச்சரிக்கை: கட்டை தளர்த்தியாக கட்டினால் இரத்தப்போக்கு அதிகரிக்கக்கூடும். முழுமையாக இறுக்கவும்!',
      hi: '⚠️ चेतावनी: टूर्निकेट को ढीला बांधने से रक्तस्राव बढ़ सकता है। इसे पूरी तरह कसें!',
      ar: '⚠️ تحذير: ربط العصابة بشكل غير محكم قد يزيد النزيف. أحكم الربط تماماً!'
    }
  },
  {
    id: 'burn_treatment',
    category: 'first_aid',
    title: {
      en: 'Subterranean Burn Treatment',
      ta: 'தீக்காயங்களுக்கு சிகிச்சை',
      hi: 'जलने का प्राथमिक चिकित्सा उपचार',
      uk: 'Перша допомога при термічних опіках',
      ar: 'علاج الحروق في الملاجئ'
    },
    steps: {
      en: [
        'Immediately cool the burn with cool (not ice cold) clean running water for at least 15 minutes.',
        'Remove any tight items (rings, necklaces, shoes) from the affected limb before swelling begins.',
        'Do NOT break any blisters as this leaves the layer open to lethal infection.',
        'Cover the burn loosely with a sterile plastic wrap or clean non-adherent dressing.'
      ],
      uk: [
        'Негайно охолоджуйте опік прохолодною (не льодяною) водою щонайменше 15 хвилин.',
        'Зніміть прикраси та тісний одяг з ураженої ділянки до появи набряку.',
        'НЕ проколюйте пухирі - це відкриває ворота для небезпечних інфекцій.',
        'Накладіть вільну чисту пов\'язку (найкраще використати чисту харчову плівку).'
      ]
    }
  },
  {
    id: 'shelling_survival',
    category: 'shelling',
    title: {
      en: 'Active Shelling & Artillery Protocol',
      ta: 'குண்டுவீச்சின் போது தப்பிக்கும் வழிமுறை',
      hi: 'सक्रिय गोलाबारी और तोपखाने से बचाव प्रणाली',
      uk: 'Правила поведінки під час артилерійського обстрілу',
      ar: 'بروتوكول التعامل أثناء القصف المدفعي'
    },
    steps: {
      en: [
        'If you hear a whistling sound or explosion, IMMEDIATELY drop to the floor. Face down, cover ears, open mouth slightly (to balance pressure).',
        'Stay away from windows, glass, and corners. Best shelter is a bathroom, staircase block, or inner load-bearing walls.',
        'Wait at least 10 minutes after the last apparent explosion before attempting to move locations.',
        'If trapped under rubble, stay calm. Cover nose and eyes with clothing to filter dust. Tap pipe structures to alert rescuers rather than shouting (saves oxygen).'
      ],
      uk: [
        'Почувши свист снаряда або вибух, НЕГАЙНО лягайте на землю обличчям вниз, закрийте вуха руками, прочиніть рот.',
        'Тримайтеся подалі від вікон, скла та опорних стовпів. Правило двох стін: безпечніше за все в коридорі, ванній кімнаті.',
        'Зачекайте щонайменше 10 хвилин після останнього вибуху перед тим, як змінити укриття.',
        'Якщо опинилися під завалами: не панікуйте. Захистіть органи дихання тканиною. Стукайте по трубах чи батареях (це чути далі, ніж крик).'
      ]
    },
    warning: {
      en: '⚠️ WARNING: Never seek cover directly beneath balconies, close to parked cars, or in unreinforced glass-facade structures.',
      uk: '⚠️ УВАГА: Ніколи не ховайтеся під балконами, поруч із припаркованими авто чи всередині скляних кіосків.'
    }
  }
];
