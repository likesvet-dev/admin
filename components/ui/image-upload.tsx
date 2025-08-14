'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlusIcon, Trash } from "lucide-react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";

interface ImageUploadProps {
    disabled?: boolean;
    onChange: (value: string) => void; // singola URL
    onRemove: (value: string) => void;
    value: string[]; // lista di URL già presenti
}

const ImageUpload: React.FC<ImageUploadProps> = ({ disabled, onChange, onRemove, value }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => setIsMounted(true), []);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleUpload = (result: any) => {
        const url = result?.info?.secure_url as string | undefined;
        if (url) onChange(url); // il push nella lista lo fa il form tramite useFieldArray.append
    };

    if (!isMounted) return null;

    return (
        <div>
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                {value.map((url) => (
                    <div key={url} className="relative w-[200px] h-[200px] rounded-md overflow-hidden max-[500px]:w-[100px] max-[500px]:h-[100px] ">
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={() => onRemove(url)}
                                variant="destructive"
                                size="sm"
                                className="cursor-pointer"
                            >
                                <Trash className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image fill className="object-cover" alt="image" src={url} />
                    </div>
                ))}
            </div>

            <CldUploadWidget
                onSuccess={handleUpload}
                uploadPreset="cmnontpg"
                options={{ multiple: true }} // permette selezioni multiple nella stessa sessione
            >
                {({ open }) => {
                    const onClick = () => open();
                    return (
                        <Button
                            type="button"
                            disabled={disabled}
                            variant="secondary"
                            onClick={onClick}
                            className="cursor-pointer"
                        >
                            <ImagePlusIcon className="w-4 h-4 mr-2" />
                            Добавить фото
                        </Button>
                    );
                }}
            </CldUploadWidget>
        </div>
    );
};

export default ImageUpload;
