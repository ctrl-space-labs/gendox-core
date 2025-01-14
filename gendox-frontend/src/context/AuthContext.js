import React, { createContext, useState, useEffect } from "react";
import {IFrameAuthProvider} from "./IFrameAuthProvider";
import {PKCEAuthProvider} from "./PKCEAuthProvider";

// ** Defaults
const defaultProvider = {
  user: null,
  loading: true,
  setUser: () => null,
  setLoading: () => Boolean,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
};

// Create context
const AuthContext = createContext(defaultProvider);

const AuthProvider = ({ children, option }) => {

  switch (option) {
    case 'IFrameAuthProvider':
      // console.log("AuthProviderSwitch - IFrameAuthProvider")
      return IFrameAuthProvider({children, defaultProvider});
    case 'UserPassAuthProvider':
      throw new Error('userPassAuthProvider not implemented')
    case 'PKCEAuthProvider':
    default:
      // console.log("AuthProviderSwitch - PKCEAuthProvider")
      return PKCEAuthProvider({children, defaultProvider});

  }

  // return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
