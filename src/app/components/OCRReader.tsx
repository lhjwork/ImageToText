"use client";

import React, { useState, useEffect, useCallback } from "react";
import Tesseract from "tesseract.js";

const OCRReader: React.FC = () => {
  const [images, setImages] = useState<(string | ArrayBuffer)[]>([]);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 이미지 업로드 핸들러
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const readers = Array.from(files).map((file) => {
        return new Promise<string | ArrayBuffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result) {
              resolve(reader.result);
            } else {
              reject("FileReader result is null");
            }
          };
          reader.onerror = () => {
            reject("FileReader error");
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(readers)
        .then((results) => {
          setImages((prevImages) => [...prevImages, ...results]);
          setText(""); // 이전 OCR 결과 초기화
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      console.error("No files selected");
    }
  }, []);

  // 클립보드 이미지 핸들러
  const handlePaste = useCallback((event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      const readers = Array.from(items).map((item) => {
        return new Promise<string | ArrayBuffer>((resolve, reject) => {
          if (item.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              const reader = new FileReader();
              reader.onload = () => {
                if (reader.result) {
                  resolve(reader.result);
                } else {
                  reject("FileReader result is null");
                }
              };
              reader.onerror = () => {
                reject("FileReader error");
              };
              reader.readAsDataURL(blob);
            }
          }
        });
      });

      Promise.all(readers)
        .then((results) => {
          setImages((prevImages) => [...prevImages, ...results]);
          setText(""); // 이전 OCR 결과 초기화
        })
        .catch((error) => {
          console.error(error);
        });
    }
  }, []);

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  // OCR 실행
  const handleOCR = useCallback(async () => {
    if (images.length === 0) {
      console.error("No images to process");
      return;
    }
    setLoading(true);
    try {
      const texts = await Promise.all(
        images.map(async (image) => {
          if (typeof image !== "string") {
            throw new Error("Invalid image format");
          }
          const {
            data: { text },
          } = await Tesseract.recognize(image, "eng+kor", {
            logger: (m) => console.log(m), // 진행 상태 로그
          });
          return text;
        })
      );
      setText(texts.join("\n\n"));
    } catch (error) {
      console.error("OCR 실패:", error);
      setText("텍스트를 추출할 수 없습니다.");
    }
    setLoading(false);
  }, [images]);

  // 이미지 삭제 핸들러
  const handleDeleteImage = useCallback((index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="flex flex-col items-center p-6 space-y-4 ">
      <h1 className="text-2xl font-bold">OCR 이미지 텍스트 추출</h1>
      <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="border p-2" />
      <div className="flex flex-wrap gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative">
            <img src={image as string} alt={`Uploaded ${index}`} className="max-w-xs rounded shadow" />
            <button onClick={() => handleDeleteImage(index)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1">
              &times;
            </button>
          </div>
        ))}
      </div>
      <button onClick={handleOCR} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" disabled={loading}>
        {loading ? "텍스트 추출 중..." : "OCR 실행"}
      </button>
      {text && (
        <div className="p-4 bg-white rounded shadow w-full max-w-md">
          <h2 className="text-lg font-bold">추출된 텍스트</h2>
          <p className="mt-2 whitespace-pre-line">{text}</p>
        </div>
      )}
    </div>
  );
};

export default OCRReader;
