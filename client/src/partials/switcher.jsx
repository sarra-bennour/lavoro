import React, { useState, useEffect } from 'react';
import Pickr from '@simonwep/pickr';
import '@simonwep/pickr/dist/themes/nano.min.css';

const Switcher = ({ toggleDarkMode, theme }) => {
  const [primaryColor, setPrimaryColor] = useState('#5c67f7');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [themeMode, setThemeMode] = useState('light');
  const [direction, setDirection] = useState('ltr');
  const [navigationStyle, setNavigationStyle] = useState('vertical');
  const [menuStyle, setMenuStyle] = useState('default');
  const [pageStyle, setPageStyle] = useState('regular');
  const [layoutWidth, setLayoutWidth] = useState('fullwidth');
  const [menuPosition, setMenuPosition] = useState('fixed');
  const [headerPosition, setHeaderPosition] = useState('fixed');
  const [loader, setLoader] = useState('disable');
  const [menuColors, setMenuColors] = useState('dark');
  const [headerColors, setHeaderColors] = useState('light');
  const [themePrimary, setThemePrimary] = useState('primary1');
  const [themeBackground, setThemeBackground] = useState('bg1');
  const [menuBackgroundImage, setMenuBackgroundImage] = useState('');

  // Initialize Pickr for primary color
  useEffect(() => {
    const pickrPrimary = Pickr.create({
      el: '.pickr-container-primary',
      theme: 'nano',
      default: primaryColor,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true,
        },
      },
    });

    pickrPrimary.on('change', (color) => {
      const rgba = color.toRGBA();
      const rgbString = `${Math.floor(rgba[0])}, ${Math.floor(rgba[1])}, ${Math.floor(rgba[2])}`;
      setPrimaryColor(color.toHEXA().toString());
      document.documentElement.style.setProperty('--primary-rgb', rgbString);
    });

    return () => pickrPrimary.destroyAndRemove();
  }, [primaryColor]);

  // Initialize Pickr for background color
  useEffect(() => {
    const pickrBackground = Pickr.create({
      el: '.pickr-container-background',
      theme: 'nano',
      default: backgroundColor,
      components: {
        preview: true,
        opacity: true,
        hue: true,
        interaction: {
          hex: true,
          rgba: true,
          hsva: true,
          input: true,
          clear: true,
          save: true,
        },
      },
    });

    pickrBackground.on('change', (color) => {
      const rgba = color.toRGBA();
      const rgbString = `${Math.floor(rgba[0])}, ${Math.floor(rgba[1])}, ${Math.floor(rgba[2])}`;
      setBackgroundColor(color.toHEXA().toString());
      document.documentElement.style.setProperty('--body-bg-rgb', rgbString);
    });

    return () => pickrBackground.destroyAndRemove();
  }, [backgroundColor]);

  // Theme Mode Change
  const handleThemeModeChange = (mode) => {
    setThemeMode(mode);
    document.documentElement.setAttribute('data-theme-mode', mode);
    localStorage.setItem('xintradarktheme', mode === 'dark');
  };

  // Direction Change
  const handleDirectionChange = (dir) => {
    setDirection(dir);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('xintrartl', dir === 'rtl');
  };

  // Navigation Style Change
  const handleNavigationStyleChange = (style) => {
    setNavigationStyle(style);
    document.documentElement.setAttribute('data-nav-layout', style);
    localStorage.setItem('xintralayout', style);
  };

  // Menu Style Change
  const handleMenuStyleChange = (style) => {
    setMenuStyle(style);
    document.documentElement.setAttribute('data-vertical-style', style);
    localStorage.setItem('xintraverticalstyles', style);
  };

  // Page Style Change
  const handlePageStyleChange = (style) => {
    setPageStyle(style);
    document.documentElement.setAttribute('data-page-style', style);
    localStorage.setItem(`xintra${style}`, true);
  };

  // Layout Width Change
  const handleLayoutWidthChange = (width) => {
    setLayoutWidth(width);
    document.documentElement.setAttribute('data-width', width);
    localStorage.setItem(`xintra${width}`, true);
  };

  // Menu Position Change
  const handleMenuPositionChange = (position) => {
    setMenuPosition(position);
    document.documentElement.setAttribute('data-menu-position', position);
    localStorage.setItem(`xintramenu${position}`, true);
  };

  // Header Position Change
  const handleHeaderPositionChange = (position) => {
    setHeaderPosition(position);
    document.documentElement.setAttribute('data-header-position', position);
    localStorage.setItem(`xintraheader${position}`, true);
  };

  // Loader Change
  const handleLoaderChange = (loader) => {
    setLoader(loader);
    document.documentElement.setAttribute('loader', loader);
    localStorage.setItem('loaderEnable', loader === 'enable');
  };

  // Menu Colors Change
  const handleMenuColorsChange = (color) => {
    setMenuColors(color);
    document.documentElement.setAttribute('data-menu-styles', color);
    localStorage.setItem('xintraMenu', color);
  };

  // Header Colors Change
  const handleHeaderColorsChange = (color) => {
    setHeaderColors(color);
    document.documentElement.setAttribute('data-header-styles', color);
    localStorage.setItem('xintraHeader', color);
  };

  // Theme Primary Change
  const handleThemePrimaryChange = (primary) => {
    setThemePrimary(primary);
    // Update primary color in localStorage and CSS
    localStorage.setItem('primaryRGB', primary);
    document.documentElement.style.setProperty('--primary-rgb', primary);
  };

  // Theme Background Change
  const handleThemeBackgroundChange = (background) => {
    setThemeBackground(background);
    // Update background color in localStorage and CSS
    localStorage.setItem('bodyBgRGB', background);
    document.documentElement.style.setProperty('--body-bg-rgb', background);
  };

  // Menu Background Image Change
  const handleMenuBackgroundImageChange = (image) => {
    setMenuBackgroundImage(image);
    document.documentElement.setAttribute('data-bg-img', image);
    localStorage.setItem('bgimg', image);
  };

  // Reset All Settings
  const handleResetAll = () => {
    setThemeMode('light');
    setDirection('ltr');
    setNavigationStyle('vertical');
    setMenuStyle('default');
    setPageStyle('regular');
    setLayoutWidth('fullwidth');
    setMenuPosition('fixed');
    setHeaderPosition('fixed');
    setLoader('disable');
    setMenuColors('dark');
    setHeaderColors('light');
    setThemePrimary('primary1');
    setThemeBackground('bg1');
    setMenuBackgroundImage('');

    document.documentElement.setAttribute('data-theme-mode', 'light');
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('data-nav-layout', 'vertical');
    document.documentElement.setAttribute('data-vertical-style', 'default');
    document.documentElement.setAttribute('data-page-style', 'regular');
    document.documentElement.setAttribute('data-width', 'fullwidth');
    document.documentElement.setAttribute('data-menu-position', 'fixed');
    document.documentElement.setAttribute('data-header-position', 'fixed');
    document.documentElement.setAttribute('loader', 'disable');
    document.documentElement.setAttribute('data-menu-styles', 'dark');
    document.documentElement.setAttribute('data-header-styles', 'light');
    document.documentElement.removeAttribute('data-bg-img');

    localStorage.clear();
  };

  return (
    <div className="offcanvas offcanvas-end" tabIndex={-1} id="switcher-canvas" aria-labelledby="offcanvasRightLabel">
      <div className="offcanvas-header border-bottom d-block p-0">
        <div className="d-flex align-items-center justify-content-between p-3">
          <h5 className="offcanvas-title text-default" id="offcanvasRightLabel">Switcher</h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
        </div>
        <nav className="border-top border-block-start-dashed">
          <div className="nav nav-tabs nav-justified" id="switcher-main-tab" role="tablist">
            <button className="nav-link active" id="switcher-home-tab" data-bs-toggle="tab" data-bs-target="#switcher-home" type="button" role="tab" aria-controls="switcher-home" aria-selected="true">Theme Styles</button>
            <button className="nav-link" id="switcher-profile-tab" data-bs-toggle="tab" data-bs-target="#switcher-profile" type="button" role="tab" aria-controls="switcher-profile" aria-selected="false">Theme Colors</button>
          </div>
        </nav>
      </div>
      <div className="offcanvas-body">
        <div className="tab-content" id="nav-tabContent">
          <div className="tab-pane fade show active border-0" id="switcher-home" role="tabpanel" aria-labelledby="switcher-home-tab" tabIndex={0}>
            {/* Theme Color Mode */}
            <div className="">
              <p className="switcher-style-head">Theme Color Mode:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-light-theme">Light</label>
                    <input className="form-check-input" type="radio" name="theme-style" id="switcher-light-theme" checked={themeMode === 'light'} onChange={() => handleThemeModeChange('light')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-dark-theme">Dark</label>
                    <input className="form-check-input" type="radio" name="theme-style" id="switcher-dark-theme" checked={themeMode === 'dark'} onChange={() => handleThemeModeChange('dark')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Directions */}
            <div className="">
              <p className="switcher-style-head">Directions:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-ltr">LTR</label>
                    <input className="form-check-input" type="radio" name="direction" id="switcher-ltr" checked={direction === 'ltr'} onChange={() => handleDirectionChange('ltr')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-rtl">RTL</label>
                    <input className="form-check-input" type="radio" name="direction" id="switcher-rtl" checked={direction === 'rtl'} onChange={() => handleDirectionChange('rtl')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Styles */}
            <div className="">
              <p className="switcher-style-head">Navigation Styles:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-vertical">Vertical</label>
                    <input className="form-check-input" type="radio" name="navigation-style" id="switcher-vertical" checked={navigationStyle === 'vertical'} onChange={() => handleNavigationStyleChange('vertical')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-horizontal">Horizontal</label>
                    <input className="form-check-input" type="radio" name="navigation-style" id="switcher-horizontal" checked={navigationStyle === 'horizontal'} onChange={() => handleNavigationStyleChange('horizontal')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Styles */}
            <div className="navigation-menu-styles">
              <p className="switcher-style-head">Vertical &amp; Horizontal Menu Styles:</p>
              <div className="row switcher-style gx-0 pb-2 gy-2">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-menu-click">Menu Click</label>
                    <input className="form-check-input" type="radio" name="navigation-menu-styles" id="switcher-menu-click" checked={menuStyle === 'menu-click'} onChange={() => handleMenuStyleChange('menu-click')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-menu-hover">Menu Hover</label>
                    <input className="form-check-input" type="radio" name="navigation-menu-styles" id="switcher-menu-hover" checked={menuStyle === 'menu-hover'} onChange={() => handleMenuStyleChange('menu-hover')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-icon-click">Icon Click</label>
                    <input className="form-check-input" type="radio" name="navigation-menu-styles" id="switcher-icon-click" checked={menuStyle === 'icon-click'} onChange={() => handleMenuStyleChange('icon-click')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-icon-hover">Icon Hover</label>
                    <input className="form-check-input" type="radio" name="navigation-menu-styles" id="switcher-icon-hover" checked={menuStyle === 'icon-hover'} onChange={() => handleMenuStyleChange('icon-hover')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidemenu Layout Styles */}
            <div className="sidemenu-layout-styles">
              <p className="switcher-style-head">Sidemenu Layout Styles:</p>
              <div className="row switcher-style gx-0 pb-2 gy-2">
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-default-menu">Default Menu</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-default-menu" checked={menuStyle === 'default'} onChange={() => handleMenuStyleChange('default')} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-closed-menu">Closed Menu</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-closed-menu" checked={menuStyle === 'closed'} onChange={() => handleMenuStyleChange('closed')} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-icontext-menu">Icon Text</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-icontext-menu" checked={menuStyle === 'icontext'} onChange={() => handleMenuStyleChange('icontext')} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-icon-overlay">Icon Overlay</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-icon-overlay" checked={menuStyle === 'overlay'} onChange={() => handleMenuStyleChange('overlay')} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-detached">Detached</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-detached" checked={menuStyle === 'detached'} onChange={() => handleMenuStyleChange('detached')} />
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-double-menu">Double Menu</label>
                    <input className="form-check-input" type="radio" name="sidemenu-layout-styles" id="switcher-double-menu" checked={menuStyle === 'doublemenu'} onChange={() => handleMenuStyleChange('doublemenu')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Page Styles */}
            <div className="">
              <p className="switcher-style-head">Page Styles:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-regular">Regular</label>
                    <input className="form-check-input" type="radio" name="page-styles" id="switcher-regular" checked={pageStyle === 'regular'} onChange={() => handlePageStyleChange('regular')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-classic">Classic</label>
                    <input className="form-check-input" type="radio" name="page-styles" id="switcher-classic" checked={pageStyle === 'classic'} onChange={() => handlePageStyleChange('classic')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-modern">Modern</label>
                    <input className="form-check-input" type="radio" name="page-styles" id="switcher-modern" checked={pageStyle === 'modern'} onChange={() => handlePageStyleChange('modern')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Layout Width Styles */}
            <div className="">
              <p className="switcher-style-head">Layout Width Styles:</p>
              <div className="row switcher-style gx-0">
                <div className="col-sm-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-full-width">Full Width</label>
                    <input className="form-check-input" type="radio" name="layout-width" id="switcher-full-width" checked={layoutWidth === 'fullwidth'} onChange={() => handleLayoutWidthChange('fullwidth')} />
                  </div>
                </div>
                <div className="col-sm-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-boxed">Boxed</label>
                    <input className="form-check-input" type="radio" name="layout-width" id="switcher-boxed" checked={layoutWidth === 'boxed'} onChange={() => handleLayoutWidthChange('boxed')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Positions */}
            <div className="">
              <p className="switcher-style-head">Menu Positions:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-menu-fixed">Fixed</label>
                    <input className="form-check-input" type="radio" name="menu-positions" id="switcher-menu-fixed" checked={menuPosition === 'fixed'} onChange={() => handleMenuPositionChange('fixed')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-menu-scroll">Scrollable</label>
                    <input className="form-check-input" type="radio" name="menu-positions" id="switcher-menu-scroll" checked={menuPosition === 'scrollable'} onChange={() => handleMenuPositionChange('scrollable')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Header Positions */}
            <div className="">
              <p className="switcher-style-head">Header Positions:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-header-fixed">Fixed</label>
                    <input className="form-check-input" type="radio" name="header-positions" id="switcher-header-fixed" checked={headerPosition === 'fixed'} onChange={() => handleHeaderPositionChange('fixed')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-header-scroll">Scrollable</label>
                    <input className="form-check-input" type="radio" name="header-positions" id="switcher-header-scroll" checked={headerPosition === 'scrollable'} onChange={() => handleHeaderPositionChange('scrollable')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Loader */}
            <div className="">
              <p className="switcher-style-head">Loader:</p>
              <div className="row switcher-style gx-0">
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-loader-enable">Enable</label>
                    <input className="form-check-input" type="radio" name="page-loader" id="switcher-loader-enable" checked={loader === 'enable'} onChange={() => handleLoaderChange('enable')} />
                  </div>
                </div>
                <div className="col-4">
                  <div className="form-check switch-select">
                    <label className="form-check-label" htmlFor="switcher-loader-disable">Disable</label>
                    <input className="form-check-input" type="radio" name="page-loader" id="switcher-loader-disable" checked={loader === 'disable'} onChange={() => handleLoaderChange('disable')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Theme Colors Tab */}
          <div className="tab-pane fade border-0" id="switcher-profile" role="tabpanel" aria-labelledby="switcher-profile-tab" tabIndex={0}>
            <div>
              <div className="theme-colors">
                <p className="switcher-style-head">Menu Colors:</p>
                <div className="d-flex switcher-style pb-2">
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-white" data-bs-toggle="tooltip" data-bs-placement="top" title="Light Menu" type="radio" name="menu-colors" id="switcher-menu-light" checked={menuColors === 'light'} onChange={() => handleMenuColorsChange('light')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Dark Menu" type="radio" name="menu-colors" id="switcher-menu-dark" checked={menuColors === 'dark'} onChange={() => handleMenuColorsChange('dark')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary" data-bs-toggle="tooltip" data-bs-placement="top" title="Color Menu" type="radio" name="menu-colors" id="switcher-menu-primary" checked={menuColors === 'primary'} onChange={() => handleMenuColorsChange('primary')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-gradient" data-bs-toggle="tooltip" data-bs-placement="top" title="Gradient Menu" type="radio" name="menu-colors" id="switcher-menu-gradient" checked={menuColors === 'gradient'} onChange={() => handleMenuColorsChange('gradient')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-transparent" data-bs-toggle="tooltip" data-bs-placement="top" title="Transparent Menu" type="radio" name="menu-colors" id="switcher-menu-transparent" checked={menuColors === 'transparent'} onChange={() => handleMenuColorsChange('transparent')} />
                  </div>
                </div>
                <div className="px-4 pb-3 text-muted fs-11">Note:If you want to change color Menu dynamically change from below Theme Primary color picker</div>
              </div>

              <div className="theme-colors">
                <p className="switcher-style-head">Header Colors:</p>
                <div className="d-flex switcher-style pb-2">
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-white" data-bs-toggle="tooltip" data-bs-placement="top" title="Light Header" type="radio" name="header-colors" id="switcher-header-light" checked={headerColors === 'light'} onChange={() => handleHeaderColorsChange('light')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-dark" data-bs-toggle="tooltip" data-bs-placement="top" title="Dark Header" type="radio" name="header-colors" id="switcher-header-dark" checked={headerColors === 'dark'} onChange={() => handleHeaderColorsChange('dark')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary" data-bs-toggle="tooltip" data-bs-placement="top" title="Color Header" type="radio" name="header-colors" id="switcher-header-primary" checked={headerColors === 'primary'} onChange={() => handleHeaderColorsChange('primary')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-gradient" data-bs-toggle="tooltip" data-bs-placement="top" title="Gradient Header" type="radio" name="header-colors" id="switcher-header-gradient" checked={headerColors === 'gradient'} onChange={() => handleHeaderColorsChange('gradient')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-transparent" data-bs-toggle="tooltip" data-bs-placement="top" title="Transparent Header" type="radio" name="header-colors" id="switcher-header-transparent" checked={headerColors === 'transparent'} onChange={() => handleHeaderColorsChange('transparent')} />
                  </div>
                </div>
                <div className="px-4 pb-3 text-muted fs-11">Note:If you want to change color Header dynamically change from below Theme Primary color picker</div>
              </div>

              <div className="theme-colors">
                <p className="switcher-style-head">Theme Primary:</p>
                <div className="d-flex flex-wrap align-items-center switcher-style">
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary-1" type="radio" name="theme-primary" id="switcher-primary" checked={themePrimary === 'primary1'} onChange={() => handleThemePrimaryChange('primary1')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary-2" type="radio" name="theme-primary" id="switcher-primary1" checked={themePrimary === 'primary2'} onChange={() => handleThemePrimaryChange('primary2')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary-3" type="radio" name="theme-primary" id="switcher-primary2" checked={themePrimary === 'primary3'} onChange={() => handleThemePrimaryChange('primary3')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary-4" type="radio" name="theme-primary" id="switcher-primary3" checked={themePrimary === 'primary4'} onChange={() => handleThemePrimaryChange('primary4')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-primary-5" type="radio" name="theme-primary" id="switcher-primary4" checked={themePrimary === 'primary5'} onChange={() => handleThemePrimaryChange('primary5')} />
                  </div>
                  <div className="form-check switch-select ps-0 mt-1 color-primary-light">
                    <div className="theme-container-primary" />
                    <div className="pickr-container-primary" onChange="updateChartColor(this.value)" />
                  </div>
                </div>
              </div>

              <div className="theme-colors">
                <p className="switcher-style-head">Theme Background:</p>
                <div className="d-flex flex-wrap align-items-center switcher-style">
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-bg-1" type="radio" name="theme-background" id="switcher-background" checked={themeBackground === 'bg1'} onChange={() => handleThemeBackgroundChange('bg1')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-bg-2" type="radio" name="theme-background" id="switcher-background1" checked={themeBackground === 'bg2'} onChange={() => handleThemeBackgroundChange('bg2')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-bg-3" type="radio" name="theme-background" id="switcher-background2" checked={themeBackground === 'bg3'} onChange={() => handleThemeBackgroundChange('bg3')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-bg-4" type="radio" name="theme-background" id="switcher-background3" checked={themeBackground === 'bg4'} onChange={() => handleThemeBackgroundChange('bg4')} />
                  </div>
                  <div className="form-check switch-select me-3">
                    <input className="form-check-input color-input color-bg-5" type="radio" name="theme-background" id="switcher-background4" checked={themeBackground === 'bg5'} onChange={() => handleThemeBackgroundChange('bg5')} />
                  </div>
                  <div className="form-check switch-select ps-0 mt-1 tooltip-static-demo color-bg-transparent">
                    <div className="theme-container-background" />
                    <div className="pickr-container-background" />
                  </div>
                </div>
              </div>

              <div className="menu-image mb-3">
                <p className="switcher-style-head">Menu With Background Image:</p>
                <div className="d-flex flex-wrap align-items-center switcher-style">
                  <div className="form-check switch-select m-2">
                    <input className="form-check-input bgimage-input bg-img1" type="radio" name="menu-background" id="switcher-bg-img" checked={menuBackgroundImage === 'bgimg1'} onChange={() => handleMenuBackgroundImageChange('bgimg1')} />
                  </div>
                  <div className="form-check switch-select m-2">
                    <input className="form-check-input bgimage-input bg-img2" type="radio" name="menu-background" id="switcher-bg-img1" checked={menuBackgroundImage === 'bgimg2'} onChange={() => handleMenuBackgroundImageChange('bgimg2')} />
                  </div>
                  <div className="form-check switch-select m-2">
                    <input className="form-check-input bgimage-input bg-img3" type="radio" name="menu-background" id="switcher-bg-img2" checked={menuBackgroundImage === 'bgimg3'} onChange={() => handleMenuBackgroundImageChange('bgimg3')} />
                  </div>
                  <div className="form-check switch-select m-2">
                    <input className="form-check-input bgimage-input bg-img4" type="radio" name="menu-background" id="switcher-bg-img3" checked={menuBackgroundImage === 'bgimg4'} onChange={() => handleMenuBackgroundImageChange('bgimg4')} />
                  </div>
                  <div className="form-check switch-select m-2">
                    <input className="form-check-input bgimage-input bg-img5" type="radio" name="menu-background" id="switcher-bg-img4" checked={menuBackgroundImage === 'bgimg5'} onChange={() => handleMenuBackgroundImageChange('bgimg5')} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="d-flex justify-content-center canvas-footer flex-nowrap gap-2">
          <a href="javascript:void(0);" id="reset-all" className="btn btn-danger text-nowrap" onClick={handleResetAll}>Reset</a>
        </div>
      </div>
    </div>
  );
};

export default Switcher;