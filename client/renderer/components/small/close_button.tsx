import {FunctionComponent} from "react";

interface _CloseButtonProps {
    buttonPressed: () => void;
}

const CloseButton: FunctionComponent<_CloseButtonProps> = ({ buttonPressed }) => {
    return (
        <button
            className="dark:bg-gray-400 bg-gray-300 rounded-full w-6 h-6"
            onClick={() => {
                buttonPressed()
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-6 flex-no-shrink fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="gray"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    )
}

export default CloseButton