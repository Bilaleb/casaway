
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import About from './About';
import Contact from './Contact';
import Layout from '../components/Layout';



function Marcup (){
    return(
        <BrowserRouter>
    

      {/* Routes */}
      <Routes>
        <Route  path="/" element={<Layout />} >
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
    )
}

export default Marcup