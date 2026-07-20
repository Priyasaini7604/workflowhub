import Sidebar from "./SideBar";
import NotificationBell from "./NotificationBell";

const Layout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060b14" }}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ marginLeft: "220px", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Top Header Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "16px 2rem 0" }}>
          <NotificationBell />
        </div>

        <div style={{ flex: 1, padding: "1.5rem 2rem 2rem", overflowY: "auto" }}>
          {children}
        </div>

      </div>

    </div>
  );
};

export default Layout;