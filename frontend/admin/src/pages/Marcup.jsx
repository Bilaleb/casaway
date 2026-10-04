
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import About from './About';
import Contact from './Contact';
import Layout from '../components/Layout';



function Marcup (){
    return(
        <BrowserRouter>
    

      {/* Routes */}
      <Routes>
        <Route  path="/" element={<Layout />} >
        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
    )
}

export default Marcup