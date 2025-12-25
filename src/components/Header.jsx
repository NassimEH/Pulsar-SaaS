import { useLocation, useNavigate } from "react-router-dom";
import { disablePageScroll, enablePageScroll } from "scroll-lock";

import { brainwave } from "../assets";
import { navigation } from "../constants";
import Button from "./Button";
import MenuSvg from "../assets/svg/MenuSvg";
import { HamburgerMenu } from "./design/Header";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Header = () => {
  const pathname = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [openNavigation, setOpenNavigation] = useState(false);

  const toggleNavigation = () => {
    if (openNavigation) {
      setOpenNavigation(false);
      enablePageScroll();
    } else {
      setOpenNavigation(true);
      disablePageScroll();
    }
  };

  const handleClick = () => {
    if (!openNavigation) return;

    enablePageScroll();
    setOpenNavigation(false);
  };

  return (
    <div
      className={`fixed top-0 left-0 w-full z-50  border-b border-n-6 lg:bg-n-8/90 lg:backdrop-blur-sm ${openNavigation ? "bg-n-8" : "bg-n-8/90 backdrop-blur-sm"
        }`}
    >
      <div className="flex items-center px-5 lg:px-7.5 xl:px-10 max-lg:py-4">
        <a className="block w-[12rem] xl:mr-8" href="#hero">
          <img src={brainwave} width={190} height={40} alt="Brainwave" />
        </a>

        <nav
          className={`${openNavigation ? "flex" : "hidden"
            } fixed top-[5rem] left-0 right-0 bottom-0 bg-n-8 lg:static lg:flex lg:mx-auto lg:bg-transparent`}
        >
          <div className="relative z-2 flex flex-col items-center justify-center m-auto lg:flex-row">
            {navigation.map((item) => (
              <a
                key={item.id}
                href={item.url}
                onClick={handleClick}
                className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-color-1 ${item.onlyMobile ? "lg:hidden" : ""
                  } px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-xs lg:font-semibold ${pathname.pathname === item.url || (item.url.startsWith('#') && pathname.hash === item.url)
                    ? "z-2 lg:text-n-1"
                    : "lg:text-n-1/50"
                  } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
              >
                {item.title}
              </a>
            ))}
            
            {isAuthenticated && (
              <a
                href="/profile"
                onClick={(e) => {
                  e.preventDefault();
                  handleClick();
                  navigate('/profile');
                }}
                className={`block relative font-code text-2xl uppercase text-n-1 transition-colors hover:text-color-1 lg:hidden px-6 py-6 md:py-8 lg:-mr-0.25 lg:text-xs lg:font-semibold ${pathname.pathname === '/profile'
                  ? "z-2 lg:text-n-1"
                  : "lg:text-n-1/50"
                } lg:leading-5 lg:hover:text-n-1 xl:px-12`}
              >
                Profil
              </a>
            )}
          </div>

          <HamburgerMenu />
        </nav>

        {isAuthenticated ? (
          <>
            <div className="hidden lg:flex items-center gap-4 mr-8">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-n-7/50 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-color-1 to-color-5 flex items-center justify-center text-sm font-bold text-n-1">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                </div>
                <span className="text-n-2 text-sm font-code group-hover:text-n-1 transition-colors">
                  {user?.full_name || user?.email?.split('@')[0]}
                </span>
              </button>
              <Button className="hidden lg:flex" onClick={logout}>
                Déconnexion
              </Button>
            </div>
          </>
        ) : (
          <>
            <a
              href="#signup"
              onClick={(e) => {
                e.preventDefault();
                navigate('/register');
              }}
              className="button hidden mr-8 text-n-1/50 transition-colors hover:text-n-1 lg:block"
            >
              Créer un compte
            </a>
            <Button 
              className="hidden lg:flex" 
              onClick={() => navigate('/login')}
            >
              Connexion
            </Button>
          </>
        )}

        <Button
          className="ml-auto lg:hidden"
          px="px-3"
          onClick={toggleNavigation}
        >
          <MenuSvg openNavigation={openNavigation} />
        </Button>
      </div>
    </div>
  );
};

export default Header;
