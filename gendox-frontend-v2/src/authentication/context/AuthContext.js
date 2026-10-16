import React, { createContext, useState, useEffect } from "react";
import {IFrameAuthProvider} from "./IFrameAuthProvider";
import {PKCEAuthProvider} from "./PKCEAuthProvider";

const initialAuth = {
  user: null,
  setLoading: () => Boolean,
  loading: true,
  setUser: () => null,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
};

const AuthContext = createContext(initialAuth);

const AuthProvider = ({ children, option }) => {

  switch (option) {
    case 'IFrameAuthProvider':
      return IFrameAuthProvider({children, initialAuth});
    case 'UserPassAuthProvider':
      throw new Error('userPassAuthProvider not implemented')
    case 'PKCEAuthProvider':
    default:
      return PKCEAuthProvider({children, initialAuth});

  }

  // return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
