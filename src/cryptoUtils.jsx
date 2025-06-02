let aesKey = null;
export async function fetchKey(apiBaseUrl) {
    try {
        const response = await fetch(`${apiBaseUrl}/api/get-key`, {
            credentials: 'include',

        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const base64Key = data.key.trim().replace(/\s+/g, '');
        const keyRaw = atob(base64Key); // Base64 → texto binario
        const keyBuffer = new Uint8Array([...keyRaw].map(c => c.charCodeAt(0))); // Texto binario → bytes

        aesKey = await crypto.subtle.importKey(

            'raw',

            keyBuffer,

            'AES-GCM',

            false,

            ['encrypt', 'decrypt']

        );
        return aesKey;
    } catch (err) {
        alert("error" + err.message);
        aesKey = null;
    }

}
export async function encryptData(data, aesKey) {
    if (!aesKey) {
        alert('La clave AES no está cargada.');
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
}


export async function decryptData(data, aesKey) {

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

}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
}

