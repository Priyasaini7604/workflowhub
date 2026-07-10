import Sidebar from "./SideBar";

const Layout = ({ children }) => {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#060b14" }}>
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ marginLeft: "220px", flex: 1, padding: "2rem", overflowY: "auto" }}>
        {children}
      </div>

    </div>
  );
};

export default Layout;