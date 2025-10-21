import Header from './Header';
import '../css/MainLayout.css';

const MainLayout = ({ children }) => {
  return (
    <div className="layout">
      <Header />
      <main className="layout-content">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
