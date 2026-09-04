# Clinical protocol knowledge base for the RAG layer (Layer 3).
#
# IMPROVEMENT: each chunk now carries a `cancer_types` tag - a list of which
# cancer type(s) it applies to, or ["general"] for guidance that isn't
# cancer-specific (e.g. "what a high risk tier means"). brain/rag_llm_layer.py
# uses this tag to keep retrieval scoped to the cancer type actually being
# assessed, instead of pulling in e.g. a lung protocol for a breast case just
# because the semantic embeddings happen to be close.
#
# Keeping this as a flat list of small dicts (title/text/cancer_types) - no
# separate file per cancer type, no external JSON - on purpose: it's short
# enough to read top-to-bottom in one sitting, and every chunk needs the same
# 3 fields, so there's nothing a more complex structure would buy us here.

protocol_chunks = [
    # ---------------- LUNG ----------------
    {
        "title": "Persistent cough duration threshold",
        "text": "A cough lasting more than three weeks should be medically evaluated. Persistent cough is one of the most common warning signs associated with lung cancer.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Hemoptysis referral urgency",
        "text": "Coughing up blood is a major warning sign that requires urgent medical attention. Even small amounts of blood in sputum should not be ignored because it may indicate a serious underlying condition.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Smoking as primary risk factor",
        "text": "Smoking is the leading preventable risk factor for lung cancer. Current and long-term smokers have a significantly higher risk than people who have never smoked.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Family history significance (lung)",
        "text": "People with a family history of lung cancer may have a higher risk of developing the disease. Family history should be considered alongside other risk factors and symptoms.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Occupational exposure risks",
        "text": "Long-term exposure to harmful substances such as asbestos, silica dust, diesel exhaust, and certain industrial chemicals can increase lung cancer risk. Occupational history is an important part of risk assessment.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Lung cancer screening age guidance",
        "text": "The risk of lung cancer generally increases with age. Most cases are diagnosed in older adults, making age an important factor during screening and risk evaluation.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Difficulty swallowing as a secondary but important symptom",
        "text": "Difficulty swallowing may occur in some patients with advanced chest diseases, including lung cancer. Persistent swallowing problems should be medically evaluated, especially when accompanied by other symptoms.",
        "cancer_types": ["lung", "oral"],
    },
    {
        "title": "Neck swelling and spread indicators",
        "text": "Swelling or lumps around the neck or collarbone area can sometimes indicate enlarged lymph nodes. When present with respiratory or oral symptoms, further medical evaluation may be needed.",
        "cancer_types": ["lung", "oral"],
    },
    {
        "title": "Smoking cessation",
        "text": "Stopping smoking is one of the most effective ways to reduce lung and oral cancer risk. Health benefits begin soon after quitting and continue to increase over time.",
        "cancer_types": ["lung", "oral"],
    },

    # ---------------- BREAST ----------------
    {
        "title": "Breast lump duration threshold",
        "text": "A breast lump or thickening that persists beyond a few weeks should be clinically evaluated, even if it is painless. A painless lump is not necessarily benign and still requires assessment.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Nipple discharge and skin changes",
        "text": "Nipple discharge, especially if blood-stained or spontaneous, and skin changes such as dimpling, puckering, or nipple retraction are warning signs that warrant a clinical breast examination.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Family history significance (breast)",
        "text": "Having a first-degree relative, such as a mother, sister, or daughter, with breast cancer meaningfully increases individual risk and should be factored into screening frequency.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Breast cancer age and screening guidance",
        "text": "Breast cancer risk rises noticeably after age 40. Clinical breast examination alongside mammography is recommended at regular intervals from this age onward.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Breast cancer high-risk referral",
        "text": "A persistent lump, nipple changes, or the combination of multiple risk factors should prompt referral for diagnostic mammography or ultrasound without delay.",
        "cancer_types": ["breast"],
    },

    # ---------------- ORAL ----------------
    {
        "title": "Persistent mouth ulcer or sore",
        "text": "A mouth ulcer or sore that does not heal within three weeks should be evaluated by a dentist or doctor, particularly in people who use tobacco.",
        "cancer_types": ["oral"],
    },
    {
        "title": "Red or white oral patches",
        "text": "Red or white patches inside the mouth, known as erythroplakia or leukoplakia, can be early and potentially precancerous changes and should not be ignored even when painless.",
        "cancer_types": ["oral"],
    },
    {
        "title": "Tobacco and areca nut risk",
        "text": "Chewing tobacco, gutka, and areca nut (paan) use are the leading risk factors for oral cancer in India, and risk increases substantially when combined with alcohol use.",
        "cancer_types": ["oral"],
    },
    {
        "title": "Oral cancer age and exposure duration guidance",
        "text": "Oral cancer risk increases with age and with the cumulative duration of tobacco or areca nut use, making long-term users a priority group for screening.",
        "cancer_types": ["oral"],
    },

    # ---------------- CERVICAL ----------------
    {
        "title": "Abnormal vaginal bleeding threshold",
        "text": "Bleeding between periods, after intercourse, or after menopause is not normal and should be evaluated promptly, since it is a key warning sign for cervical abnormalities.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "HPV as primary risk factor",
        "text": "Persistent infection with high-risk HPV types is the primary cause of cervical cancer. An HPV-positive result increases the importance of staying on schedule with regular screening.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "Cervical screening interval guidance",
        "text": "Regular Pap smear or HPV testing, generally recommended between ages 30 and 65, is one of the most effective ways to detect precancerous changes before they progress.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "Abnormal discharge and pelvic pain",
        "text": "Persistent abnormal vaginal discharge or pelvic pain, especially alongside irregular bleeding, warrants gynecological evaluation.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "Overdue screening risk",
        "text": "Being overdue for cervical screening raises the risk of late detection, since early cervical changes often produce no noticeable symptoms.",
        "cancer_types": ["cervical"],
    },

    # ---------------- GENERAL (tier guidance, applies to any cancer type) ----------------
    # NOTE: the original "High risk referral guidance" chunk specifically
    # mentioned "hemoptysis" as an example, which made it lung-specific in
    # substance even though it was framed generically. It's been reworded
    # here to be genuinely cancer-agnostic so it can be reused across all 4
    # cancer types instead of duplicating near-identical text per cancer.
    {
        "title": "High risk referral guidance",
        "text": "Individuals with multiple risk factors or serious warning signs should seek prompt medical evaluation. Early referral helps ensure timely diagnosis and treatment, regardless of cancer type.",
        "cancer_types": ["general"],
    },
    {
        "title": "Medium risk follow up",
        "text": "Individuals with moderate risk factors should schedule a routine medical consultation. Symptoms that persist or worsen over time should not be ignored.",
        "cancer_types": ["general"],
    },
    {
        "title": "Low risk guidance",
        "text": "A low risk assessment does not completely rule out disease. Individuals should continue monitoring symptoms and seek medical advice if new concerns develop.",
        "cancer_types": ["general"],
    },

        # --- Added: Layer 3 strengthening pass ---
    {
        "title": "Low-dose CT screening for high-risk groups",
        "text": "Annual low-dose CT screening is recommended for long-term heavy smokers, particularly those aged 50 and above, even without symptoms. This can detect lung changes earlier than symptom-based evaluation alone.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Unexplained weight loss as a warning sign",
        "text": "Losing a noticeable amount of weight without trying, especially alongside respiratory symptoms, is a warning sign that should prompt medical evaluation rather than being attributed to diet or stress alone.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Persistent chest pain evaluation",
        "text": "Chest pain that is persistent, worsens with deep breathing or coughing, or does not have an obvious cause such as injury should be evaluated by a doctor.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Passive smoking and second-hand smoke exposure",
        "text": "Regular exposure to second-hand smoke at home or work increases lung cancer risk even for people who have never smoked themselves. This exposure history is a relevant part of risk evaluation.",
        "cancer_types": ["lung"],
    },
    {
        "title": "Breast self-awareness practice",
        "text": "Becoming familiar with the normal look and feel of your breasts makes it easier to notice changes early. This is a complement to, not a replacement for, clinical screening.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Mammography screening interval by age",
        "text": "Women aged 40 to 49 should discuss individual screening timing with a doctor based on personal risk factors; women 50 and above are generally recommended to have regular mammograms at set intervals.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Breast pain alone is usually not a primary warning sign",
        "text": "Breast pain without a lump, skin change, or discharge is common and often linked to the menstrual cycle rather than cancer. It's still worth mentioning at a checkup, but pain alone is not typically an urgent red flag the way a lump or skin change is.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Dense breast tissue and screening",
        "text": "Dense breast tissue can make mammograms harder to interpret and is itself associated with a modestly higher risk. Women with known dense breast tissue may be advised to have supplemental screening alongside standard mammography.",
        "cancer_types": ["breast"],
    },
    {
        "title": "Routine dental check-ups aid early detection",
        "text": "Regular dental visits allow a professional to notice early mouth changes a person might not see themselves, which is one of the most effective ways oral cancer gets caught early.",
        "cancer_types": ["oral"],
    },
    {
        "title": "Betel nut and paan-specific risk",
        "text": "Chewing betel nut or paan, with or without tobacco, directly increases oral cancer risk and is associated with submucous fibrosis, a condition that can progress toward malignancy. Frequency and duration of use both matter.",
        "cancer_types": ["oral"],
    },
    {
        "title": "Pain or difficulty chewing as a symptom",
        "text": "New or persistent pain, numbness, or difficulty chewing and moving the jaw, especially alongside a mouth ulcer or patch, should be evaluated promptly.",
        "cancer_types": ["oral"],
    },
    {
        "title": "HPV vaccination as primary prevention",
        "text": "HPV vaccination, most effective when given before the start of sexual activity, significantly reduces the risk of developing cervical cancer later in life and is a key primary prevention tool alongside screening.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "Bleeding after intercourse",
        "text": "Bleeding specifically triggered by intercourse, even if infrequent, is a distinct warning sign from irregular period bleeding and should be mentioned to a doctor rather than dismissed.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "Cervical cancer is highly preventable",
        "text": "With regular screening and, where available, HPV vaccination, cervical cancer is one of the most preventable cancers. Precancerous changes usually take years to develop, which gives screening a wide window to catch them early.",
        "cancer_types": ["cervical"],
    },
    {
        "title": "What to expect after a screening referral",
        "text": "A referral for further screening is a precautionary step, not a diagnosis. Most people referred for follow-up testing after an initial risk assessment do not turn out to have cancer.",
        "cancer_types": ["general"],
    },
    {
        "title": "Low-cost and government screening access in India",
        "text": "Government district hospitals and primary health centers offer free or low-cost cancer screening services, including under national health mission programs, making initial evaluation accessible regardless of ability to pay for private care.",
        "cancer_types": ["general"],
    },
]