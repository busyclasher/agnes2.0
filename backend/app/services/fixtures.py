from __future__ import annotations

from copy import deepcopy

from app.models import SupportedLanguage

TRANSLATIONS = {
    "fall_hazard": {
        SupportedLanguage.BENGALI: {
            "translated_text": "বিপদ: খোলা প্রান্ত। নিরাপত্তা হারনেস পরুন। অনুমতি ছাড়া প্রবেশ করবেন না।",
            "plain_explanation": "উঁচু জায়গা থেকে পড়ে যাওয়ার ঝুঁকি আছে।",
            "audio_text": "বিপদ। এখানে উঁচু জায়গা থেকে পড়ে যাওয়ার ঝুঁকি আছে। অনুমতি ছাড়া প্রবেশ করবেন না। নিরাপত্তা হারনেস পরুন।",
        },
        SupportedLanguage.TAMIL: {
            "translated_text": "ஆபத்து: திறந்த விளிம்பு. பாதுகாப்புக் கயிறு அணியவும். அனுமதியின்றி நுழைய வேண்டாம்.",
            "plain_explanation": "உயரத்திலிருந்து விழும் அபாயம் உள்ளது.",
            "audio_text": "ஆபத்து. இங்கு உயரத்திலிருந்து விழும் அபாயம் உள்ளது. அனுமதியின்றி நுழைய வேண்டாம். பாதுகாப்புக் கயிறு அணியவும்.",
        },
        SupportedLanguage.HINDI: {
            "translated_text": "खतरा: खुला किनारा। सुरक्षा हार्नेस पहनें। बिना अनुमति प्रवेश न करें।",
            "plain_explanation": "ऊंचाई से गिरने का खतरा है।",
            "audio_text": "खतरा। यहां ऊंचाई से गिरने का जोखिम है। बिना अनुमति प्रवेश न करें। सुरक्षा हार्नेस पहनें।",
        },
    },
    "chemical_hazard": {
        SupportedLanguage.BENGALI: {
            "translated_text": "সতর্কতা: ক্ষয়কারী রাসায়নিক। গ্লাভস ও চোখের সুরক্ষা ব্যবহার করুন।",
            "plain_explanation": "এই রাসায়নিক ত্বক ও চোখ পুড়িয়ে দিতে পারে।",
            "audio_text": "সতর্কতা। ক্ষয়কারী রাসায়নিক। স্পর্শ করবেন না। গ্লাভস ও চোখের সুরক্ষা ব্যবহার করুন।",
        },
        SupportedLanguage.TAMIL: {
            "translated_text": "எச்சரிக்கை: அரிக்கும் இரசாயனம். கையுறையும் கண் பாதுகாப்பும் அணியவும்.",
            "plain_explanation": "இந்த இரசாயனம் தோல் மற்றும் கண்களுக்கு தீங்கு செய்யலாம்.",
            "audio_text": "எச்சரிக்கை. அரிக்கும் இரசாயனம். தொட வேண்டாம். கையுறையும் கண் பாதுகாப்பும் அணியவும்.",
        },
        SupportedLanguage.HINDI: {
            "translated_text": "चेतावनी: संक्षारक रसायन। दस्ताने और आंखों की सुरक्षा पहनें।",
            "plain_explanation": "यह रसायन त्वचा और आंखों को जला सकता है।",
            "audio_text": "चेतावनी। संक्षारक रसायन। इसे न छुएं। दस्ताने और आंखों की सुरक्षा पहनें।",
        },
    },
    "ppe_required": {
        SupportedLanguage.BENGALI: {
            "translated_text": "এই এলাকার বাইরে হেলমেট, নিরাপত্তা জুতা ও উচ্চ দৃশ্যমানতার পোশাক পরতে হবে।",
            "plain_explanation": "এগিয়ে যাওয়ার আগে প্রয়োজনীয় সুরক্ষা সরঞ্জাম পরুন।",
            "audio_text": "সতর্কতা। এগিয়ে যাওয়ার আগে হেলমেট, নিরাপত্তা জুতা ও উচ্চ দৃশ্যমানতার পোশাক পরুন।",
        },
        SupportedLanguage.TAMIL: {
            "translated_text": "இந்த இடத்திற்கு அப்பால் தலைக்கவசம், பாதுகாப்புக் காலணி மற்றும் தெளிவாகத் தெரியும் உடை அணிய வேண்டும்.",
            "plain_explanation": "தொடர்வதற்கு முன் தேவையான பாதுகாப்பு உபகரணங்களை அணியவும்.",
            "audio_text": "எச்சரிக்கை. தொடர்வதற்கு முன் தலைக்கவசம், பாதுகாப்புக் காலணி மற்றும் தெளிவாகத் தெரியும் உடை அணியவும்.",
        },
        SupportedLanguage.HINDI: {
            "translated_text": "इस क्षेत्र के आगे हेलमेट, सुरक्षा जूते और हाई-विजिबिलिटी कपड़े पहनना आवश्यक है।",
            "plain_explanation": "आगे जाने से पहले आवश्यक सुरक्षा उपकरण पहनें।",
            "audio_text": "सावधानी। आगे जाने से पहले हेलमेट, सुरक्षा जूते और हाई-विजिबिलिटी कपड़े पहनें।",
        },
    },
}

BASE_FIXTURES = {
    "fall_hazard": {
        "detected_text": "DANGER: OPEN EDGE. WEAR SAFETY HARNESS. NO UNAUTHORISED ENTRY.",
        "risk_level": "red",
        "risk_label": "Danger",
        "risk_reason": "A fall hazard and restricted area warning appear on the sign.",
        "hazard_type": "fall_hazard",
        "ppe_required": [
            {"name": "Safety helmet", "icon": "helmet", "required": True},
            {"name": "Safety harness", "icon": "harness", "required": True},
        ],
        "action_steps": [
            {"label": "Do not enter unless authorised.", "priority": "high"},
            {"label": "Wear and secure a safety harness.", "priority": "high"},
            {"label": "Check with your supervisor if unsure.", "priority": "medium"},
        ],
        "confidence": 0.94,
        "uncertainty_note": "The supplied demo sign is clear and front-facing.",
        "pictogram_prompt": "Simple red card with an open-edge fall symbol, no-entry symbol, helmet, and harness.",
    },
    "chemical_hazard": {
        "detected_text": "WARNING: CORROSIVE CHEMICAL. WEAR GLOVES AND EYE PROTECTION.",
        "risk_level": "red",
        "risk_label": "Danger",
        "risk_reason": "The label appears to warn about a corrosive chemical.",
        "hazard_type": "chemical_hazard",
        "ppe_required": [
            {"name": "Chemical gloves", "icon": "gloves", "required": True},
            {"name": "Eye protection", "icon": "goggles", "required": True},
        ],
        "action_steps": [
            {"label": "Do not touch or open the container.", "priority": "high"},
            {"label": "Wear gloves and eye protection.", "priority": "high"},
            {"label": "Check the site chemical procedure.", "priority": "medium"},
        ],
        "confidence": 0.92,
        "uncertainty_note": "The supplied demo label is clear; confirm the actual container procedure on site.",
        "pictogram_prompt": "Simple red corrosive-chemical card with gloves, goggles, and do-not-touch symbols.",
    },
    "ppe_required": {
        "detected_text": "PPE REQUIRED BEYOND THIS POINT: HARD HAT, SAFETY BOOTS, HI-VIS.",
        "risk_level": "yellow",
        "risk_label": "Caution",
        "risk_reason": "The sign requires protective equipment before entering.",
        "hazard_type": "ppe_required",
        "ppe_required": [
            {"name": "Safety helmet", "icon": "helmet", "required": True},
            {"name": "Safety boots", "icon": "boots", "required": True},
            {"name": "High-visibility clothing", "icon": "vest", "required": True},
        ],
        "action_steps": [
            {"label": "Stop and check your PPE before entering.", "priority": "high"},
            {"label": "Wear a helmet, safety boots, and hi-vis.", "priority": "high"},
            {"label": "Ask your supervisor if equipment is missing.", "priority": "medium"},
        ],
        "confidence": 0.96,
        "uncertainty_note": "The supplied demo notice is clear and readable.",
        "pictogram_prompt": "Simple yellow PPE card with helmet, safety boots, and high-visibility vest.",
    },
}

GENERIC_LIVE_PHOTO_TRANSLATIONS = {
    SupportedLanguage.BENGALI: {
        "translated_text": (
            "ছবিটি পরিষ্কারভাবে পড়া যায়নি। দয়া করে সাইনটির কাছ থেকে সোজা ছবি তুলুন "
            "এবং নিশ্চিত না হলে সুপারভাইজারের সঙ্গে পরীক্ষা করুন।"
        ),
        "plain_explanation": "ছবিটি থেকে সতর্কবার্তাটি পরিষ্কারভাবে নিশ্চিত করা যায়নি।",
        "audio_text": (
            "আমি পুরোপুরি নিশ্চিত নই কারণ ছবিটি অস্পষ্ট। দয়া করে কাছ থেকে আবার ছবি তুলুন। "
            "নিশ্চিত না হলে সুপারভাইজারের সঙ্গে পরীক্ষা করুন।"
        ),
    },
    SupportedLanguage.TAMIL: {
        "translated_text": (
            "படத்தில் உள்ள சின்னத்தை தெளிவாகப் படிக்க முடியவில்லை. சின்னத்துக்கு அருகில் "
            "நேராக மீண்டும் படம் எடுக்கவும். தெளிவில்லையெனில் மேற்பார்வையாளரிடம் சரிபார்க்கவும்."
        ),
        "plain_explanation": "இந்த படத்திலிருந்து எச்சரிக்கையை தெளிவாக உறுதிப்படுத்த முடியவில்லை.",
        "audio_text": (
            "படம் தெளிவாக இல்லாததால் நான் முழுமையாக உறுதியாக இல்லை. அருகில் இருந்து மீண்டும் "
            "படம் எடுக்கவும். தெளிவில்லையெனில் மேற்பார்வையாளரிடம் சரிபார்க்கவும்."
        ),
    },
    SupportedLanguage.HINDI: {
        "translated_text": (
            "फोटो में संकेत साफ़ पढ़ा नहीं जा सका। कृपया संकेत के पास जाकर सीधी फोटो लें "
            "और संदेह हो तो सुपरवाइज़र से जांच करें।"
        ),
        "plain_explanation": "इस फोटो से चेतावनी स्पष्ट रूप से पुष्टि नहीं हो सकी।",
        "audio_text": (
            "मैं पूरी तरह निश्चित नहीं हूं क्योंकि फोटो साफ़ नहीं है। कृपया पास से फिर फोटो लें। "
            "संदेह हो तो सुपरवाइज़र से जांच करें।"
        ),
    },
}

GENERIC_LIVE_PHOTO_FIXTURE = {
    "detected_text": "unknown",
    "risk_level": "unknown",
    "risk_label": "Unclear",
    "risk_reason": (
        "The uploaded photo could not be read clearly enough to identify the sign or grade the risk."
    ),
    "hazard_type": "unclear_sign",
    "ppe_required": [],
    "action_steps": [
        {"label": "Retake the photo closer and straight-on.", "priority": "high"},
        {"label": "Do not rely on this result if the sign is safety-critical.", "priority": "high"},
        {"label": "Please check with your supervisor if unsure.", "priority": "high"},
    ],
    "confidence": 0.62,
    "uncertainty_note": "I am not fully certain because the image could not be read clearly.",
    "pictogram_prompt": (
        "Simple grey unclear-sign card with a camera retake symbol and supervisor-check symbol."
    ),
}


def scan_fixture(kind: str, language: SupportedLanguage) -> dict:
    result = deepcopy(BASE_FIXTURES[kind])
    result.update(TRANSLATIONS[kind][language])
    return result


def live_photo_fallback(language: SupportedLanguage) -> dict:
    result = deepcopy(GENERIC_LIVE_PHOTO_FIXTURE)
    result.update(GENERIC_LIVE_PHOTO_TRANSLATIONS[language])
    return result
