"use client";

import React, { useState } from "react";
import Tesseract from "tesseract.js";

const OCRReader: React.FC = () => {
  const [image, setImage] = useState<string | ArrayBuffer | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setImage(reader.result);
          setText(""); // 이전 OCR 결과 초기화
        } else {
          console.error("FileReader result is null");
        }
      };
      reader.onerror = () => {
        console.error("FileReader error");
      };
      reader.readAsDataURL(file);
    } else {
      console.error("No file selected");
    }
  };

  // OCR 실행
  const handleOCR = async () => {
    if (!image || typeof image !== "string") {
      console.error("Invalid image format");
      return;
    }
    setLoading(true);
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(image, "eng+kor", {
        logger: (m) => console.log(m), // 진행 상태 로그
      });
      setText(text);
    } catch (error) {
      console.error("OCR 실패:", error);
      setText("텍스트를 추출할 수 없습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-4 md:flex-row md:space-y-0 md:space-x-4">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-2xl font-bold">OCR 이미지 텍스트 추출</h1>
        <input type="file" accept="image/*" onChange={handleImageUpload} className="border p-2" />
        {image && <img src={image as string} alt="Uploaded" className="max-w-xs rounded shadow" />}
        <button onClick={handleOCR} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" disabled={loading}>
          {loading ? "텍스트 추출 중..." : "OCR 실행"}
        </button>
      </div>
      {text && (
        <div className="p-4 bg-white rounded shadow w-full max-w-md md:ml-4">
          <h2 className="text-lg font-bold">추출된 텍스트</h2>
          <p className="mt-2 whitespace-pre-line">{text}</p>
        </div>
      )}
    </div>
  );
};

export default OCRReader;
