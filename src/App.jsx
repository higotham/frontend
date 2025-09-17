import { Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import Signup from '@/pages/Signup';
import Header from '@/components/Common/Header.jsx';
import Canvas from '@/pages/Canvas.jsx';
import Library from '@/pages/Library.jsx';
import StoryboardLibrary from '@/pages/StoryboardLibrary.jsx';
import StoryboardWorkspace from '@/pages/StoryboardWorkspace.jsx';

export default function App(){
  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/canvas" element={<Canvas/>}/>
        <Route path="/library" element={<Library/>}/>
        <Route path="/storyboards" element={<StoryboardLibrary/>}/>
        <Route path="/storyboards/:id" element={<StoryboardWorkspace/>}/>
      </Routes>
    </>
  );
}
