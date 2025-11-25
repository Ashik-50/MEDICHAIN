import { createContext, useContext, useState } from "react";

const KeyContext = createContext();

export function KeyProvider({ children }) {
  const [keys, setKeys] = useState({
    publicKey: null,
    privateKey: null,
  });

  const generateKeys = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign", "verify"]
    );

    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    setKeys({
      publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))),
      privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))),
    });
  };

  return (
    <KeyContext.Provider value={{ keys, generateKeys }}>
      {children}
    </KeyContext.Provider>
  );
}

export function useKeys() {
  return useContext(KeyContext);
}
