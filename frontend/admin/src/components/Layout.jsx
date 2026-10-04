
import { Outlet } from 'react-router-dom';
import Header from './Sidebar';
import Footer from './Footer';

function Layout (){
    return(
        <>
        <Header/>
       <Outlet /> 
       <Footer/>
        </>
    )
}

export default Layout