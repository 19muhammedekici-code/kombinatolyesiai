import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { ClothingItem, Category } from "../types";

// --- SYSTEM INSTRUCTION (VIRTUAL TRY-ON & ID RETENTION) ---
// Model: Gemini 3 Pro Image Preview (High Fidelity Editing)
// Amaç: Referans görseldeki kişiyi değiştirmeden sadece ilgili kıyafet/aksesuarı değiştirmek.

const BASE_INSTRUCTION = `
ROLE: ELITE AI PHOTO EDITOR & RETOUCHER (NOT A GENERATOR).
TASK: Perform precise "INPAINTING" on the Source Image.

### 🛑 CRITICAL IDENTITY LOCK PROTOCOL:
1.  **THE SOURCE IMAGE IS IMMUTABLE:** Do NOT generate a new person. Do NOT change the pose. Do NOT change the background.
2.  **PIXEL PRESERVATION:** For any area NOT being edited (e.g., face, hands, background), you must copy the original pixels exactly.
3.  **FACE SECURITY:** The face MUST match the source image 100%. If the face changes, the task is a FAILURE.

### 🛠️ EDITING MODES:

#### A. CLOTHING SWAP (Top/Bottom/Dress):
- **Action:** "Deep Texture Inpainting".
- **Logic:** Conceptually ERASE the old clothes within the body contours. FILL that specific area with the new texture.
- **Constraint:** Do not overlay. The old clothes must be gone, but the BODY SHAPE must remain consistent.

#### B. ACCESSORY & SHOE INSERTION (STRICTEST MODE):
- **Action:** "Composite & Blend".
- **Logic:** The base image is a LOCKED CANVAS. You are only allowed to paint on the feet (for shoes) or add an item (for accessories).
- **Forbidden:** You CANNOT redraw the person to fit the accessory. You must fit the accessory to the person.
- **Example:** If adding shoes, keep the legs, knees, and floor EXACTLY the same. Only change the pixels below the ankles.
`;

const cleanBase64 = (data: string) => data.split(',')[1] || data;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }
];

export const generateOutfit = async (
  modelImageBase64: string,
  clothingItems: ClothingItem[],
  userContext?: string,
  onProgress?: (step: number, total: number, message: string) => void
): Promise<string> => {
  
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
  if (!apiKey) throw new Error("API Key eksik. Lütfen yapılandırmayı kontrol edin.");

  const ai = new GoogleGenAI({ apiKey: apiKey });

  if (onProgress) onProgress(1, 4, "Görüntü işleme motoru başlatılıyor (Pro Mode)...");

  const parts: any[] = [];

  // 1. REFERANS GÖRSEL (SOURCE OF TRUTH)
  parts.push({ text: "SOURCE_IMAGE (CANVAS): This is the Master Image. You must edit THIS image, not create a new one. Isolate the subject and background." });
  parts.push({ inlineData: { data: cleanBase64(modelImageBase64), mimeType: "image/jpeg" } });

  // 2. KATEGORİ AYRIŞTIRMA
  const tops = clothingItems.filter(i => i.category === Category.TOP);
  const bottoms = clothingItems.filter(i => i.category === Category.BOTTOM);
  const onePieces = clothingItems.filter(i => i.category === Category.ONE_PIECE);
  const shoes = clothingItems.filter(i => i.category === Category.SHOES);
  const accessories = clothingItems.filter(i => i.category === Category.ACCESSORIES);

  const hasTop = tops.length > 0;
  const hasBottom = bottoms.length > 0;
  const hasOnePiece = onePieces.length > 0;

  // 3. PROMPT OLUŞTURMA
  let promptDirectives = "### EDITING JOB TICKET ###\n";

  // --- KIYAFET DEĞİŞİM SENARYOLARI ---

  if (hasOnePiece) {
     const item = onePieces[0];
     parts.push({ text: `TARGET_ITEM_DRESS:` });
     parts.push({ inlineData: { data: cleanBase64(item.imageUrl), mimeType: "image/jpeg" } });
     
     promptDirectives += `
     TASK: DRESS REPLACEMENT
     1. MASK: Create a mental mask of the current clothes (neck to ankles).
     2. ERASE: Remove old clothes inside the mask.
     3. INPAINT: Fill the mask with 'TARGET_ITEM_DRESS'.
     4. LOCK: Keep head, hair, arms, and background 100% unchanged.
     `;
  } 
  else if (hasTop && hasBottom) {
     const topItem = tops[0];
     const bottomItem = bottoms[0];
     
     parts.push({ text: `TARGET_ITEM_TOP:` });
     parts.push({ inlineData: { data: cleanBase64(topItem.imageUrl), mimeType: "image/jpeg" } });
     parts.push({ text: `TARGET_ITEM_BOTTOM:` });
     parts.push({ inlineData: { data: cleanBase64(bottomItem.imageUrl), mimeType: "image/jpeg" } });

     promptDirectives += `
     TASK: FULL OUTFIT REPLACEMENT
     1. MASK: Torso + Legs.
     2. ERASE: Remove old top and old bottom.
     3. INPAINT: Apply 'TARGET_ITEM_TOP' to upper body, 'TARGET_ITEM_BOTTOM' to lower body.
     4. LOCK: Do not change the person's identity.
     `;
  } 
  else if (hasTop) {
     const item = tops[0];
     parts.push({ text: `TARGET_ITEM_TOP:` });
     parts.push({ inlineData: { data: cleanBase64(item.imageUrl), mimeType: "image/jpeg" } });
     
     promptDirectives += `
     TASK: TOP REPLACEMENT ONLY
     1. MASK: Torso only.
     2. ERASE: Remove old shirt.
     3. INPAINT: Apply 'TARGET_ITEM_TOP'.
     4. PROTECT: Do NOT touch the pants/skirt. The lower body must remain pixel-perfect.
     `;
  }
  else if (hasBottom) {
     const item = bottoms[0];
     parts.push({ text: `TARGET_ITEM_BOTTOM:` });
     parts.push({ inlineData: { data: cleanBase64(item.imageUrl), mimeType: "image/jpeg" } });
     
     promptDirectives += `
     TASK: BOTTOM REPLACEMENT ONLY
     1. MASK: Legs only.
     2. ERASE: Remove old pants/skirt.
     3. INPAINT: Apply 'TARGET_ITEM_BOTTOM'.
     4. PROTECT: Do NOT touch the shirt. The upper body must remain pixel-perfect.
     `;
  }

  // --- AYAKKABI (STRICT INPAINTING) ---
  if (shoes.length > 0) {
      const item = shoes[0];
      parts.push({ text: `TARGET_ITEM_SHOES:` });
      parts.push({ inlineData: { data: cleanBase64(item.imageUrl), mimeType: "image/jpeg" } });
      
      promptDirectives += `
      TASK: SHOE SWAP (HIGH PRECISION)
      *** CRITICAL WARNING: DO NOT REGENERATE THE IMAGE ***
      1. LOCATE: Identify the feet/shoes area only.
      2. MASK: Everything else (Face, Body, Clothes, Background) is LOCKED.
      3. ACTION: Replace ONLY the pixels of the shoes with 'TARGET_ITEM_SHOES'.
      4. RESULT: The same photo, just different shoes.
      `;
  }

  // --- AKSESUARLAR (COMPOSITING) ---
  accessories.forEach((item, idx) => {
      parts.push({ text: `TARGET_ACCESSORY_${idx}:` });
      parts.push({ inlineData: { data: cleanBase64(item.imageUrl), mimeType: "image/jpeg" } });
      promptDirectives += `
      TASK: ACCESSORY ADDITION
      1. ACTION: Place 'TARGET_ACCESSORY_${idx}' onto the model naturally (e.g., handbag in hand, glasses on eyes).
      2. CONSTRAINT: Do not redraw the person. If adding a bag, just add the bag. Do not change the dress or the face.
      `;
  });

  if (userContext) {
    promptDirectives += `\nUSER STYLE PREFERENCE: ${userContext}\n`;
  }

  promptDirectives += `\nFINAL CHECK: If the output looks like a different person or a different location, reset and try again to match the SOURCE_IMAGE exactly.`;

  parts.push({ text: promptDirectives });

  if (onProgress) onProgress(2, 4, "Referans görsel kilitleniyor...");

  try {
    // Gemini 3 Pro Image Preview modelini kullanıyoruz (Yüksek Kalite & Sadakat)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', 
      contents: { parts },
      config: {
        systemInstruction: BASE_INSTRUCTION,
        safetySettings,
        // Temperature 0: Deterministik çıktı, yaratıcılık minimum, sadakat maksimum.
        temperature: 0, 
      }
    });

    if (onProgress) onProgress(3, 4, "Piksel düzenleme yapılıyor...");

    const candidate = response.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      throw new Error("Görsel güvenlik politikaları nedeniyle oluşturulamadı. Lütfen farklı bir fotoğraf deneyin.");
    }

    // Gemini 3 serisi genellikle görseli 'image' tool veya inlineData olarak döner ama 
    // generateContent text+image döndüğünde parçaları kontrol etmeliyiz.
    // Pro Image modelinden gelen yanıt yapısını kontrol ediyoruz.
    
    let base64Image = null;
    
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (base64Image) {
      if (onProgress) onProgress(4, 4, "Tamamlandı!");
      return base64Image;
    } else {
      console.error("Gemini Empty Response or Text Only:", JSON.stringify(response));
      // Bazen model sadece metin dönebilir, bu bir hatadır.
      throw new Error("Görsel oluşturulamadı. Model sadece metin yanıtı vermiş olabilir.");
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};