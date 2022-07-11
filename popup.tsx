import { useStorage } from "@plasmohq/storage";
function IndexPopup() {
  const [showSideBarInfo, setShowSideBarInfo] = useStorage<boolean>(
    "showSideBarInfo",
    false,
  );
  const [hideDuoIfCall, setHideDuoIfCall] = useStorage<boolean>(
    "hideDuoIfCall",
    false,
  );
  return (
    <div
      style={{
        width: "200px",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        fontSize: 12,
        textAlign: "center",
      }}
    >
      <h1>Made for all you hard stuck bronzes that spam !duo in chat</h1>
      <form
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "start",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={showSideBarInfo}
            onChange={() => {
              setShowSideBarInfo(!showSideBarInfo);
            }}
          />Show duo in sidebar
        </label>
        <label>
          <input
            type="checkbox"
            checked={hideDuoIfCall}
            onChange={() => {
              setHideDuoIfCall(!hideDuoIfCall);
            }}
          />Hide duo tag if !call is active
        </label>
      </form>
      <p
        style={{
          fontSize: 12,
        }}
      >
        Made by a hard stuck silver
        <a
          style={{
            color: "#457e8f",
          }}
          href="https://www.twitter.com/berbaroovez "
        >
          Berbaroovez
        </a>
      </p>
    </div>
  );
}

export default IndexPopup;
