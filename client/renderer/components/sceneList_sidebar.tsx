import {FunctionComponent, useContext, useState} from "react";
import {useRouter} from "next/dist/client/router";
import {AppControlContext} from "./appControlHandler";
import SettingsIcon from "./icons/settings";
import CloseButton from "./small/close_button";
import styles from "../styles/SceneListSidebar.module.css"
import DMXProjectSceneGroup from "../backend/structs/DMXProjectSceneGroup";

interface _SceneListSidebarProps {
    hideView: () => void;
}

const SceneListSidebar: FunctionComponent<_SceneListSidebarProps> = ({hideView}) => {
    const router = useRouter();

    const { GlobalProjectManager, sendDMXCommand } = useContext(AppControlContext);

    const [selectedGroup, setSelectedGroup] = useState<DMXProjectSceneGroup | undefined>(undefined);

    return (
        <div className="pb-4 right-4 absolute bottom-4 top-4 flex">
            <div className={"dark:bg-gray-800 bg-gray-200 p-4 shadow-2xl rounded-2xl flex flex-col w-80 bottom-4"}>
                <div className="flex justify-between">
                    <div className="flex">
                        <h1 className="font-bold dark:text-white text-xl">
                            Scene List
                        </h1>
                    </div>

                    <CloseButton buttonPressed={() => hideView()} />
                </div>
                <div className={"flex flex-wrap min-w-min"}>
                    {["Default", "Cool", "no", "another one", "aaaa"].map(e => (
                        <div className={`p-0.5 px-2 m-1 border border-gray-400 rounded-xl text-center ${e === "Default" ? "bg-gray-400" : "bg-transparent"} ${styles.groupselectionbox}`}>
                            <p>{e}</p>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}

export default SceneListSidebar;