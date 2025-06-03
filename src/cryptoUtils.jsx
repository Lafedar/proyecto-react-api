
export async function encryptData(data, aesKey) {
    try {
        if (!aesKey) {
            console.error('La clave AES no está cargada.' + aesKey);
            return null;
        }
        const payload = JSON.stringify({ data });

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encodedMessage = new TextEncoder().encode(payload);

        const ciphertextBuffer = await crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            aesKey,
            encodedMessage
        );

        return {
            ciphertext: arrayBufferToBase64(ciphertextBuffer),
            iv: arrayBufferToBase64(iv)
        };
    } catch (err) {
        console.error("Error al encriptar:", err);
        return null;
    }

}


export async function decryptData(data, aesKey) {

    try {
        const ciphertextWithTag = Uint8Array.from(atob(data.ciphertext), c => c.charCodeAt(0));

        const iv = Uint8Array.from(atob(data.iv), c => c.charCodeAt(0));


        const decryptedBuffer = await window.crypto.subtle.decrypt(

            {

                name: "AES-GCM",

                iv: iv

            },

            aesKey,

            ciphertextWithTag

        );


        return new TextDecoder().decode(decryptedBuffer);

    } catch (err) {
        console.error("Error al desencriptar:", err);
        return null;
    }

}

export function arrayBufferToBase64(buffer) {  // Convierte un ArrayBuffer a una cadena Base64
    try {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        bytes.forEach(b => binary += String.fromCharCode(b));
        return btoa(binary);
    }catch(err) {
        console.error("Error al convertir ArrayBuffer a Base64:", err);
        return null;
    }
   
}



