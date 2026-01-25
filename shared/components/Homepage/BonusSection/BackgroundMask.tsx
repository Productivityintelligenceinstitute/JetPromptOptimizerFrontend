import React from "react";

export default function BackgroundMask() {
    return (
        <div
            className="absolute inset-0 opacity-30"
            style={{
                backgroundImage: "url(/assets/mask.png)",
                backgroundSize: "auto",
                backgroundPosition: "center",
            }}
            aria-hidden="true"
        />
    );
}
