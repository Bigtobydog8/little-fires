import React, { useState, useEffect } from 'react';

export default function LittleFires() {
  const [appMode, setAppMode] = useState('tasks'); // 'tasks', 'projects', 'notes', 'goals', 'archive', 'time'
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentList, setCurrentList] = useState('master');
  const [selectedPriority, setSelectedPriority] = useState('low');
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedSection, setSelectedSection] = useState('todo');
  const [searchQuery, setSearchQuery] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Standalone time logs state
  const [standaloneTimeLogs, setStandaloneTimeLogs] = useState(() => {
    const saved = localStorage.getItem('standaloneTimeLogs');
    return saved ? JSON.parse(saved) : [];
  });

  // Load Tesseract.js for OCR
  useEffect(() => {
    if (!window.Tesseract) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        console.log('Tesseract.js loaded successfully');
      };
      script.onerror = () => {
        console.error('Failed to load Tesseract.js from CDN');
      };
      document.body.appendChild(script);
    }
  }, []);
  
  const [allLists, setAllLists] = useState(() => {
    const saved = localStorage.getItem('little_fires_lists');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add travel list if it doesn't exist
    if (!parsed.travel) {
      parsed.travel = [];
    }
    
    // Migration: Add kids list if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [archivedTasks, setArchivedTasks] = useState(() => {
    const saved = localStorage.getItem('little_fires_archived');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('little_fires_notes');
    return saved ? JSON.parse(saved) : [];
  });

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('little_fires_projects');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('little_fires_goals');
    const parsed = saved ? JSON.parse(saved) : {
      personal: [],
      work: [],
      home: [],
      travel: [],
      kids: []
    };
    
    // Migration: Add kids if it doesn't exist
    if (!parsed.kids) {
      parsed.kids = [];
    }
    
    return parsed;
  });

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [timeLoggerContext, setTimeLoggerContext] = useState(null); // { type: 'goal' | 'note', id, listName? }
  const [currentGoalList, setCurrentGoalList] = useState('master');
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [goalToDelete, setGoalToDelete] = useState(null);
  const [showTimeLogger, setShowTimeLogger] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [loggedMinutes, setLoggedMinutes] = useState(0);
  const [timerDuration, setTimerDuration] = useState(''); // Duration in seconds for progress ring, blank by default
  const [logStartTime, setLogStartTime] = useState(null);
  const [editingTimeLog, setEditingTimeLog] = useState(null);
  const [timeLogFocus, setTimeLogFocus] = useState('');
  const [timeLogDescription, setTimeLogDescription] = useState('');
  const [timeLogTakeAway, setTimeLogTakeAway] = useState('');
  const [timeLogMinutes, setTimeLogMinutes] = useState('');
  const [expandedTimeLogId, setExpandedTimeLogId] = useState(null);

  const [selectedProject, setSelectedProject] = useState(null);
  const [currentProjectList, setCurrentProjectList] = useState('master');
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState(false);
  const [editingGoalName, setEditingGoalName] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(null); // stores taskId when editing
  const [projectTaskInput, setProjectTaskInput] = useState('');
  const [projectTaskList, setProjectTaskList] = useState('personal');
  const [projectTaskSection, setProjectTaskSection] = useState('todo');
  const [projectTaskDueDate, setProjectTaskDueDate] = useState('');
  const [projectTaskPriority, setProjectTaskPriority] = useState('low');
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const [noteSearchQuery, setNoteSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedCalendarTaskId, setExpandedCalendarTaskId] = useState(null);
  const [expandedCalendarNoteId, setExpandedCalendarNoteId] = useState(null);
  const [expandedCalendarProjectId, setExpandedCalendarProjectId] = useState(null);
  const [showOpenTasks, setShowOpenTasks] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [showProjects, setShowProjects] = useState(true);
  
  const [lastArchiveCheck, setLastArchiveCheck] = useState(() => {
    const saved = localStorage.getItem('little_fires_last_archive_check');
    return saved || new Date().toISOString();
  });

  useEffect(() => {
    localStorage.setItem('little_fires_lists', JSON.stringify(allLists));
  }, [allLists]);

  useEffect(() => {
    localStorage.setItem('little_fires_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('little_fires_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('little_fires_goals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem('standaloneTimeLogs', JSON.stringify(standaloneTimeLogs));
  }, [standaloneTimeLogs]);

  // Timer for time logging
  useEffect(() => {
    let interval;
    if (isLogging && logStartTime) {
      interval = setInterval(() => {
        const now = Date.now();
        const elapsedMinutes = Math.floor((now - logStartTime) / 60000);
        setLoggedMinutes(elapsedMinutes);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLogging, logStartTime]);

  useEffect(() => {
    localStorage.setItem('little_fires_archived', JSON.stringify(archivedTasks));
  }, [archivedTasks]);

  // Auto-archive completed tasks from previous months on app load
  useEffect(() => {
    const now = new Date();
    const lastCheck = new Date(lastArchiveCheck);
    
    // Check if we're in a new month since last check
    const isNewMonth = now.getMonth() !== lastCheck.getMonth() || 
                       now.getFullYear() !== lastCheck.getFullYear();
    
    if (isNewMonth) {
      autoArchiveCompletedTasks();
      const newCheckDate = now.toISOString();
      setLastArchiveCheck(newCheckDate);
      localStorage.setItem('little_fires_last_archive_check', newCheckDate);
    }
  }, []);

  const getCurrentTasks = () => {
    if (currentList === 'master') {
      const masterTasks = [];
      ['personal', 'work', 'home', 'travel', 'kids'].forEach(listName => {
        if (allLists[listName]) {
          allLists[listName].forEach((task, index) => {
            masterTasks.push({
              ...task,
              sourceList: listName,
              sourceIndex: index,
              isArchived: false
            });
          });
        }
        
        // If there's a search query, also include archived tasks
        if (searchQuery && archivedTasks[listName]) {
          archivedTasks[listName].forEach((task, index) => {
            masterTasks.push({
              ...task,
              sourceList: listName,
              sourceIndex: index,
              isArchived: true
            });
          });
        }
      });
      return masterTasks;
    }
    return allLists[currentList] || [];
  };

  const applyFilters = (tasks) => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const addTask = () => {
    if (!taskInput.trim()) return;

    const newTask = {
      text: taskInput,
      completed: false,
      priority: selectedPriority,
      section: selectedSection,
      dueDate: dueDate || null,
      details: '',
      id: Date.now(),
      createdAt: new Date().toISOString(),
      projectId: null,
      assignedChild: selectedChild
    };

    setAllLists(prev => ({
      ...prev,
      [currentList]: [newTask, ...prev[currentList]]
    }));

    setTaskInput('');
    setDueDate('');
    setSelectedPriority('low');
    setSelectedSection('todo');
    setSelectedChild(null);
  };

  const toggleTask = (listName, index) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      const task = newLists[listName][index];
      task.completed = !task.completed;
      
      if (task.completed) {
        task.completedAt = new Date().toISOString();
      } else {
        delete task.completedAt;
      }
      
      return newLists;
    });
  };

  const deleteTask = (listName, index) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      newLists[listName].splice(index, 1);
      return newLists;
    });
  };

  const archiveTask = (listName, index) => {
    const task = allLists[listName][index];
    if (!task.completed) return; // Only archive completed tasks
    
    // Add to archived tasks
    setArchivedTasks(prev => ({
      ...prev,
      [listName]: [...(prev[listName] || []), { ...task, archivedAt: new Date().toISOString() }]
    }));
    
    // Remove from active lists
    deleteTask(listName, index);
  };

  const unarchiveTask = (listName, index) => {
    const task = archivedTasks[listName][index];
    
    // Add back to active lists
    setAllLists(prev => ({
      ...prev,
      [listName]: [...prev[listName], { ...task, archivedAt: undefined }]
    }));
    
    // Remove from archived
    setArchivedTasks(prev => {
      const newArchived = { ...prev };
      newArchived[listName].splice(index, 1);
      return newArchived;
    });
  };

  const deleteArchivedTask = (listName, index) => {
    setArchivedTasks(prev => {
      const newArchived = { ...prev };
      newArchived[listName].splice(index, 1);
      return newArchived;
    });
  };

  const updateTaskDetails = (listName, index, details) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      newLists[listName][index].details = details;
      return newLists;
    });
  };

  const updateTaskDueDate = (listName, index, newDueDate) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      newLists[listName][index].dueDate = newDueDate;
      return newLists;
    });
  };

  const updateTaskPriority = (listName, index, priority) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      newLists[listName][index].priority = priority;
      return newLists;
    });
  };

  const moveTaskToSection = (listName, index, newSection) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      newLists[listName][index].section = newSection;
      return newLists;
    });
  };

  // Note management functions
  const addNote = () => {
    const newNote = {
      id: Date.now(),
      date: new Date().toISOString(),
      content: '',
      tags: [],
      expanded: true,
      images: []
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const updateNote = (id, content) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  };

  const deleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const toggleNoteExpanded = (id) => {
    setNotes(prev => prev.map(note =>
      note.id === id ? { ...note, expanded: !note.expanded } : note
    ));
  };

  const addImageToNote = async (noteId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Compress image before storing
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions to reduce size
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      
      // Check if adding this image would exceed storage
      const currentSize = JSON.stringify(notes).length;
      const imageSize = compressedImage.length;
      
      // Rough localStorage limit is 5-10MB, warn at 4MB
      if (currentSize + imageSize > 4000000) {
        alert('Storage limit approaching! Consider removing old images or notes to free up space.');
        return;
      }
      
      const imageId = Date.now();
      
      // Add image to note
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const images = note.images || [];
          return { 
            ...note, 
            images: [...images, { 
              id: imageId, 
              data: compressedImage,
              extractedText: '',
              isProcessing: true
            }] 
          };
        }
        return note;
      }));

      // Perform OCR
      console.log('Starting OCR...');
      try {
        // Wait for Tesseract to load if needed (up to 15 seconds)
        let attempts = 0;
        while (!window.Tesseract && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (window.Tesseract) {
          console.log('Tesseract loaded, creating worker...');
          const worker = await window.Tesseract.createWorker('eng');
          console.log('Worker created, recognizing...');
          const { data: { text } } = await worker.recognize(compressedImage);
          console.log('OCR complete, text:', text);
          await worker.terminate();
          
          // Update with extracted text
          setNotes(prev => prev.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                images: (note.images || []).map(img => 
                  img.id === imageId 
                    ? { ...img, extractedText: text.trim() || 'No text detected', isProcessing: false }
                    : img
                )
              };
            }
            return note;
          }));
        } else {
          console.error('Tesseract failed to load after waiting');
          // OCR library not loaded
          setNotes(prev => prev.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                images: (note.images || []).map(img => 
                  img.id === imageId 
                    ? { ...img, extractedText: 'OCR library failed to load. Try refreshing the page.', isProcessing: false }
                    : img
                )
              };
            }
            return note;
          }));
        }
      } catch (error) {
        console.error('OCR failed:', error);
        // Mark as failed
        setNotes(prev => prev.map(note => {
          if (note.id === noteId) {
            return {
              ...note,
              images: (note.images || []).map(img => 
                img.id === imageId 
                  ? { ...img, extractedText: `OCR error: ${error.message || 'Unknown error'}. Try refreshing the page.`, isProcessing: false }
                  : img
              )
            };
          }
          return note;
        }));
      }
    } catch (error) {
      console.error('Image compression failed:', error);
      alert('Failed to process image. Please try a smaller image.');
    }
  };

  const removeImageFromNote = (noteId, imageId) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, images: (note.images || []).filter(img => img.id !== imageId) }
        : note
    ));
  };

  const addGalleryPhotoToNote = async (noteId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    // Compress image before storing
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions to reduce size
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to compressed JPEG with 0.7 quality
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      
      // Check if adding this image would exceed storage
      const currentSize = JSON.stringify(notes).length;
      const imageSize = compressedImage.length;
      
      if (currentSize + imageSize > 4000000) {
        alert('Storage limit approaching! Consider removing old images or notes to free up space.');
        return;
      }
      
      const photoId = Date.now();
      
      // Add photo to gallery (without OCR processing)
      setNotes(prev => prev.map(note => {
        if (note.id === noteId) {
          const gallery = note.gallery || [];
          return { 
            ...note, 
            gallery: [...gallery, { id: photoId, data: compressedImage }]
          };
        }
        return note;
      }));
    } catch (error) {
      console.error('Error adding gallery photo:', error);
    }
  };

  const removeGalleryPhotoFromNote = (noteId, photoId) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, gallery: (note.gallery || []).filter(photo => photo.id !== photoId) }
        : note
    ));
  };

  const fetchLocationForNote = async (noteId) => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    // Set a temporary "loading" message
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, location: 'Detecting location...' } : note
    ));

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve, 
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using Nominatim (OpenStreetMap)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          {
            headers: {
              'User-Agent': 'LittleFiresApp/1.0'
            }
          }
        );
        const data = await response.json();

        // Extract city and state/country
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || '';
        const state = address.state || '';
        const country = address.country || '';

        let locationString = '';
        if (city && state) {
          locationString = `${city}, ${state}`;
        } else if (city && country) {
          locationString = `${city}, ${country}`;
        } else if (state && country) {
          locationString = `${state}, ${country}`;
        } else {
          locationString = city || state || country || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        }

        // Update note with location
        setNotes(prev => prev.map(note =>
          note.id === noteId ? { ...note, location: locationString } : note
        ));
      } catch (geoError) {
        // If geocoding fails, just show coordinates
        console.error('Geocoding error:', geoError);
        setNotes(prev => prev.map(note =>
          note.id === noteId ? { ...note, location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` } : note
        ));
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      let errorMessage = 'Location unavailable';
      if (error.code === 1) {
        errorMessage = 'Location permission denied';
      } else if (error.code === 2) {
        errorMessage = 'Location unavailable';
      } else if (error.code === 3) {
        errorMessage = 'Location timeout';
      }
      setNotes(prev => prev.map(note =>
        note.id === noteId ? { ...note, location: errorMessage } : note
      ));
    }
  };

  const updateNoteLocation = (noteId, location) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId ? { ...note, location } : note
    ));
  };

  const addTagToNote = (noteId, tag) => {
    if (!tag.trim()) return;
    setNotes(prev => prev.map(note => {
      if (note.id === noteId) {
        const tags = note.tags || [];
        if (!tags.includes(tag.trim())) {
          return { ...note, tags: [...tags, tag.trim()] };
        }
      }
      return note;
    }));
  };

  const removeTagFromNote = (noteId, tagToRemove) => {
    setNotes(prev => prev.map(note =>
      note.id === noteId 
        ? { ...note, tags: (note.tags || []).filter(tag => tag !== tagToRemove) }
        : note
    ));
  };

  const getAllTags = () => {
    const tagSet = new Set();
    notes.forEach(note => {
      (note.tags || []).forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  };

  const filterNotes = () => {
    let filtered = notes;
    
    // Filter by search query
    if (noteSearchQuery) {
      filtered = filtered.filter(note => {
        const contentMatch = (note.content || '').toLowerCase().includes(noteSearchQuery.toLowerCase());
        const tagMatch = (note.tags || []).some(tag => tag.toLowerCase().includes(noteSearchQuery.toLowerCase()));
        const imageTextMatch = (note.images || []).some(img => 
          (img.extractedText || '').toLowerCase().includes(noteSearchQuery.toLowerCase())
        );
        return contentMatch || tagMatch || imageTextMatch;
      });
    }
    
    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(note => (note.tags || []).includes(selectedTag));
    }
    
    return filtered;
  };

  // Calendar helper functions
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const isSameDate = (date1, date2) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Helper function to parse date strings as local dates (not UTC)
  const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    // Split the date string and create date in local timezone
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  const getItemsForDate = (date) => {
    const items = [];
    
    // Get tasks based on filters
    const allTaskLists = ['personal', 'work', 'home', 'travel', 'kids'];
    allTaskLists.forEach(listName => {
      (allLists[listName] || []).forEach(task => {
        // Show incomplete tasks on their due date (both To Do and Backlog)
        if (showOpenTasks && task.dueDate && !task.completed) {
          const taskDate = parseLocalDate(task.dueDate);
          if (taskDate && isSameDate(taskDate, date)) {
            items.push({
              type: 'task',
              data: task,
              list: listName,
              status: 'open'
            });
          }
        }
        
        // Show completed tasks on their completion date
        if (showCompletedTasks && task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (isSameDate(completedDate, date)) {
            items.push({
              type: 'task',
              data: task,
              list: listName,
              status: 'completed'
            });
          }
        }
      });
    });
    
    // Get notes written on this date
    if (showNotes) {
      notes.forEach(note => {
        const noteDate = new Date(note.date);
        if (isSameDate(noteDate, date)) {
          items.push({
            type: 'note',
            data: note
          });
        }
      });
    }
    
    // Get projects based on start or end date
    if (showProjects) {
      const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
      allProjectLists.forEach(listName => {
        (projects[listName] || []).forEach(project => {
          let shouldShow = false;
          let dateType = '';
          
          if (project.startDate) {
            const startDate = parseLocalDate(project.startDate);
            if (startDate && isSameDate(startDate, date)) {
              shouldShow = true;
              dateType = 'start';
            }
          }
          
          if (project.endDate) {
            const endDate = parseLocalDate(project.endDate);
            if (endDate && isSameDate(endDate, date)) {
              shouldShow = true;
              dateType = dateType === 'start' ? 'both' : 'end';
            }
          }
          
          if (shouldShow) {
            items.push({
              type: 'project',
              data: project,
              list: listName,
              dateType: dateType
            });
          }
        });
      });
    }
    
    return items;
  };

  const navigateMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    } else if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
  };

  const getActiveProjectsForMonth = (month, year) => {
    if (!showProjects) return [];
    
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    const activeProjects = [];
    
    const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
    allProjectLists.forEach(listName => {
      (projects[listName] || []).forEach(project => {
        if (!project.startDate || !project.endDate) return;
        
        const projectStart = parseLocalDate(project.startDate);
        const projectEnd = parseLocalDate(project.endDate);
        
        if (!projectStart || !projectEnd) return;
        
        // Check if project overlaps with current month
        if (projectStart <= monthEnd && projectEnd >= monthStart) {
          activeProjects.push({
            ...project,
            listName,
            startDate: projectStart,
            endDate: projectEnd
          });
        }
      });
    });
    
    return activeProjects;
  };

  const autoArchiveCompletedTasks = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const allTaskLists = ['personal', 'work', 'home', 'travel', 'kids'];
    
    allTaskLists.forEach(listName => {
      const tasksToArchive = (allLists[listName] || []).filter(task => {
        if (!task.completed || !task.completedAt) return false;
        
        const completedDate = new Date(task.completedAt);
        // Archive tasks completed before the current month
        return completedDate < currentMonthStart;
      });
      
      // Archive each task
      tasksToArchive.forEach(task => {
        const taskIndex = allLists[listName].findIndex(t => t === task);
        if (taskIndex !== -1) {
          // Add to archived tasks
          setArchivedTasks(prev => ({
            ...prev,
            [listName]: [...(prev[listName] || []), { ...task, archivedAt: new Date().toISOString() }]
          }));
        }
      });
      
      // Remove from active lists
      if (tasksToArchive.length > 0) {
        setAllLists(prev => ({
          ...prev,
          [listName]: (prev[listName] || []).filter(task => 
            !tasksToArchive.some(archivedTask => archivedTask === task)
          )
        }));
      }
    });
  };

  // Project management functions
  const addProject = (listName, name, description, startDate, endDate) => {
    const newProject = {
      id: Date.now(),
      name,
      description,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: new Date().toISOString()
    };
    setProjects(prev => ({
      ...prev,
      [listName]: [newProject, ...(prev[listName] || [])]
    }));
    return newProject.id;
  };

  const submitProjectForm = () => {
    if (!projectFormData.name.trim()) return;
    
    if (editingProject) {
      // Edit existing project
      updateProject(editingProject.listName, editingProject.id, {
        name: projectFormData.name.trim(),
        description: projectFormData.description.trim(),
        startDate: projectFormData.startDate,
        endDate: projectFormData.endDate
      });
      setEditingProject(null);
    } else {
      // Create new project in current list
      addProject(
        currentProjectList,
        projectFormData.name.trim(),
        projectFormData.description.trim(),
        projectFormData.startDate,
        projectFormData.endDate
      );
    }
    
    setShowProjectForm(false);
    setProjectFormData({ name: '', description: '', startDate: '', endDate: '' });
  };

  const updateProject = (listName, id, updates) => {
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(project =>
        project.id === id ? { ...project, ...updates } : project
      )
    }));
  };

  const addPhotoToProject = async (listName, projectId, file, photoType) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      const photoId = Date.now();
      
      setProjects(prev => ({
        ...prev,
        [listName]: (prev[listName] || []).map(project => {
          if (project.id === projectId) {
            const photoArray = project[photoType] || [];
            return { 
              ...project, 
              [photoType]: [...photoArray, { id: photoId, data: compressedImage }]
            };
          }
          return project;
        })
      }));
    } catch (error) {
      console.error('Error adding photo to project:', error);
    }
  };

  const removePhotoFromProject = (listName, projectId, photoId, photoType) => {
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(project =>
        project.id === projectId 
          ? { ...project, [photoType]: (project[photoType] || []).filter(photo => photo.id !== photoId) }
          : project
      )
    }));
  };

  const deleteProject = (listName, id) => {
    // Also remove project assignment from all tasks
    const allTaskLists = ['personal', 'work', 'home', 'travel', 'kids'];
    setAllLists(prev => {
      const newLists = { ...prev };
      allTaskLists.forEach(taskListName => {
        newLists[taskListName] = (newLists[taskListName] || []).map(task =>
          task.projectId == id ? { ...task, projectId: null } : task
        );
      });
      return newLists;
    });
    setProjects(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).filter(project => project.id != id)
    }));
    setSelectedProject(null); // Close project detail view after deletion
  };

  // Goal Functions
  const addGoal = (listName, name, description, startDate, endDate) => {
    const newGoal = {
      id: Date.now(),
      name,
      description: description || '',
      outcome: '',
      startDate: startDate || null,
      endDate: endDate || null,
      timeLogged: 0,
      timeLogs: [],
      createdAt: new Date().toISOString()
    };
    setGoals(prev => ({
      ...prev,
      [listName]: [newGoal, ...(prev[listName] || [])]
    }));
    return newGoal.id;
  };

  const updateGoal = (listName, id, updates) => {
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(goal =>
        goal.id === id ? { ...goal, ...updates } : goal
      )
    }));
  };

  const addPhotoToGoal = async (listName, goalId, file, photoType) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const compressImage = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            const maxDimension = 1200;
            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = (height / width) * maxDimension;
                width = maxDimension;
              } else {
                width = (width / height) * maxDimension;
                height = maxDimension;
              }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    };
    
    try {
      const compressedImage = await compressImage(file);
      const photoId = Date.now();
      
      setGoals(prev => ({
        ...prev,
        [listName]: (prev[listName] || []).map(goal => {
          if (goal.id === goalId) {
            const photoArray = goal[photoType] || [];
            return { 
              ...goal, 
              [photoType]: [...photoArray, { id: photoId, data: compressedImage }]
            };
          }
          return goal;
        })
      }));
    } catch (error) {
      console.error('Error adding photo to goal:', error);
    }
  };

  const removePhotoFromGoal = (listName, goalId, photoId, photoType) => {
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).map(goal =>
        goal.id === goalId 
          ? { ...goal, [photoType]: (goal[photoType] || []).filter(photo => photo.id !== photoId) }
          : goal
      )
    }));
  };

  const deleteGoal = (listName, id) => {
    // Remove goal assignment from all projects
    const allProjectLists = ['personal', 'work', 'home', 'travel', 'kids'];
    setProjects(prev => {
      const newProjects = { ...prev };
      allProjectLists.forEach(projectListName => {
        newProjects[projectListName] = (newProjects[projectListName] || []).map(project =>
          project.goalId == id ? { ...project, goalId: null } : project
        );
      });
      return newProjects;
    });
    setGoals(prev => ({
      ...prev,
      [listName]: (prev[listName] || []).filter(goal => goal.id != id)
    }));
    setSelectedGoal(null);
  };

  const getCurrentGoals = () => {
    if (currentGoalList === 'master') {
      const masterGoals = [];
      ['personal', 'work', 'home', 'travel', 'kids'].forEach(listName => {
        (goals[listName] || []).forEach(goal => {
          masterGoals.push({
            ...goal,
            listName
          });
        });
      });
      return masterGoals;
    }
    return goals[currentGoalList] || [];
  };

  const addTaskToProject = (projectId, listName) => {
    if (!projectTaskInput.trim()) return;

    const newTask = {
      text: projectTaskInput,
      completed: false,
      priority: projectTaskPriority,
      section: projectTaskSection,
      dueDate: projectTaskDueDate || null,
      details: '',
      id: Date.now(),
      createdAt: new Date().toISOString(),
      projectId: projectId
    };

    setAllLists(prev => ({
      ...prev,
      [listName]: [newTask, ...(prev[listName] || [])]
    }));

    setProjectTaskInput('');
    setProjectTaskSection('todo');
    setProjectTaskDueDate('');
    setProjectTaskPriority('low');
  };

  const getCurrentProjects = () => {
    if (currentProjectList === 'master') {
      const masterProjects = [];
      ['personal', 'work', 'home', 'travel'].forEach(listName => {
        if (projects[listName]) {
          projects[listName].forEach(project => {
            masterProjects.push({
              ...project,
              sourceList: listName
            });
          });
        }
      });
      return masterProjects;
    }
    return projects[currentProjectList] || [];
  };

  const getAllTimeLogs = () => {
    const allLogs = [];
    
    // Get time logs from all goals
    const allGoalLists = ['personal', 'work', 'home', 'travel', 'kids'];
    allGoalLists.forEach(listName => {
      (goals[listName] || []).forEach(goal => {
        if (goal.timeLogs && goal.timeLogs.length > 0) {
          goal.timeLogs.forEach(log => {
            allLogs.push({
              ...log,
              source: 'goal',
              sourceName: goal.name,
              sourceId: goal.id,
              listName
            });
          });
        }
      });
    });
    
    // Get time logs from all notes
    notes.forEach(note => {
      if (note.timeLogs && note.timeLogs.length > 0) {
        note.timeLogs.forEach(log => {
          allLogs.push({
            ...log,
            source: 'journal',
            sourceName: new Date(note.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            }),
            sourceId: note.id
          });
        });
      }
    });
    
    // Get standalone time logs
    standaloneTimeLogs.forEach(log => {
      allLogs.push({
        ...log,
        source: 'time',
        sourceName: 'Standalone Time Log'
      });
    });
    
    // Sort by date (newest first)
    return allLogs.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getProjectTasks = (projectId) => {
    const tasks = [];
    const allTaskLists = ['personal', 'work', 'home', 'travel', 'kids'];
    
    allTaskLists.forEach(listName => {
      (allLists[listName] || []).forEach((task, index) => {
        // Use == to handle string/number comparison
        if (task.projectId == projectId && task.projectId !== null && task.projectId !== '') {
          tasks.push({
            ...task,
            listName,
            index
          });
        }
      });
    });
    
    return tasks;
  };

  const getAllProjects = () => {
    const allProjects = [];
    ['personal', 'work', 'home', 'travel', 'kids'].forEach(listName => {
      (projects[listName] || []).forEach(project => {
        allProjects.push({
          ...project,
          listName
        });
      });
    });
    return allProjects;
  };

  const assignTaskToProject = (listName, taskIndex, projectId) => {
    setAllLists(prev => {
      const newLists = { ...prev };
      // Convert to number if it's a string, or null if empty
      newLists[listName][taskIndex].projectId = projectId ? Number(projectId) : null;
      return newLists;
    });
  };

  const Task = ({ task, listName, index, showMoveButtons }) => {
    const dueDate = task.dueDate ? parseLocalDate(task.dueDate) : null;
    const isOverdue = dueDate && dueDate < new Date() && !task.completed;
    const dueDateText = dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    const completedDate = task.completedAt ? new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
    
    const isExpanded = expandedTaskId === `${listName}-${index}`;
    const taskRef = React.useRef(null);

    React.useEffect(() => {
      if (!isExpanded) return;

      const handleClickOutside = (e) => {
        if (taskRef.current && !taskRef.current.contains(e.target)) {
          setExpandedTaskId(null);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isExpanded]);

    return (
      <div 
        ref={taskRef}
        className={`task ${task.completed ? 'completed' : ''} ${isExpanded ? 'expanded' : ''} ${task.isArchived ? 'archived-task-readonly' : ''}`}
        onClick={() => !task.isArchived && setExpandedTaskId(isExpanded ? null : `${listName}-${index}`)}
        style={{pointerEvents: task.isArchived ? 'none' : 'auto', opacity: task.isArchived ? 0.7 : 1}}
      >
        {task.priority && task.priority !== 'low' && (
          <div className={`priority-indicator ${task.priority}`}></div>
        )}
        
        <div className="task-main">
          <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => {
                e.stopPropagation();
                if (!task.isArchived) toggleTask(listName, index);
              }}
              onClick={(e) => e.stopPropagation()}
              disabled={task.isArchived}
            />
          </div>
          <div className="task-content">
            {isExpanded && editingTaskName === `${listName}-${index}` ? (
              <input
                type="text"
                value={task.text}
                onChange={(e) => {
                  e.stopPropagation();
                  const updatedLists = { ...allLists };
                  updatedLists[listName][index] = { ...task, text: e.target.value };
                  setAllLists(updatedLists);
                }}
                onBlur={() => setEditingTaskName(null)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setEditingTaskName(null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'rgba(42, 42, 62, 0.8)',
                  border: '2px solid rgba(125, 211, 192, 0.3)',
                  borderRadius: '8px',
                  color: '#f4e8d8',
                  fontSize: '1rem',
                  fontFamily: 'Quicksand, sans-serif',
                  fontWeight: '600'
                }}
              />
            ) : (
              <div 
                className="task-text"
                onClick={(e) => {
                  if (isExpanded) {
                    e.stopPropagation();
                    setEditingTaskName(`${listName}-${index}`);
                  }
                }}
                style={{cursor: isExpanded ? 'text' : 'pointer'}}
              >
                {task.text}
              </div>
            )}
            <div className="task-meta">
              {dueDate && !task.completed && (
                <span className={`task-due-date ${isOverdue ? 'overdue' : ''}`}>📅 {dueDateText}</span>
              )}
            </div>
          </div>
          {task.priority === 'high' && (
            <span className="pinned-flame-right">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width: '20px', height: '20px', display: 'inline-block'}}>
                <path d="M 32 8 Q 26 14 22 24 Q 18 35 20 46 Q 23 54 32 58 Q 41 54 44 46 Q 46 35 42 24 Q 38 14 32 8 Z" fill="#FF6B35" opacity="0.8"/>
                <path d="M 32 8 Q 36 14 40 24 Q 44 35 42 46 Q 39 52 32 56 Q 25 52 22 46 Q 20 35 24 24 Q 28 14 32 8 Z" fill="#FF8C42" opacity="0.9"/>
                <path d="M 32 12 Q 28 18 26 28 Q 24 38 27 46 Q 29 50 32 52 Q 35 50 37 46 Q 40 38 38 28 Q 36 18 32 12 Z" fill="#FFD93D"/>
                <path d="M 32 18 Q 30 24 29 32 Q 28 40 30 46 Q 31 48 32 49 Q 33 48 34 46 Q 36 40 35 32 Q 34 24 32 18 Z" fill="#FFF4CC"/>
              </svg>
            </span>
          )}
        </div>

        {isExpanded && (
          <div className="task-details-section">
            <label className="details-label">Details</label>
            <div className="richtext-toolbar" onClick={(e) => e.stopPropagation()}>
              <button 
                className="toolbar-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Find and focus the details richtext area
                  const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                  detailsArea.focus();
                  
                  // Ensure cursor is positioned
                  const selection = window.getSelection();
                  if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                    const range = document.createRange();
                    range.selectNodeContents(detailsArea);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  } else {
                    const range = selection.getRangeAt(0);
                    
                    // Create a div wrapper for the checkbox line
                    const checkboxLine = document.createElement('div');
                    checkboxLine.className = 'checkbox-line';
                    checkboxLine.style.display = 'block';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.className = 'task-checkbox';
                    checkbox.onclick = (evt) => evt.stopPropagation();
                    
                    const textSpan = document.createElement('span');
                    textSpan.innerHTML = '&nbsp;';
                    textSpan.contentEditable = 'true';
                    
                    checkboxLine.appendChild(checkbox);
                    checkboxLine.appendChild(textSpan);
                    
                    // Insert line break before if needed
                    const beforeBreak = document.createElement('br');
                    range.insertNode(beforeBreak);
                    range.collapse(false);
                    
                    range.insertNode(checkboxLine);
                    
                    // Insert line break after
                    const afterBreak = document.createElement('br');
                    range.collapse(false);
                    range.insertNode(afterBreak);
                    
                    // Move cursor into the text span
                    const newRange = document.createRange();
                    newRange.setStart(textSpan, 0);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  }
                }}
                title="Insert Checkbox"
              >
                ☑ Box
              </button>
              <button 
                className="toolbar-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Find and focus the details richtext area
                  const detailsArea = e.target.closest('.task-details-section').querySelector('.details-richtext');
                  detailsArea.focus();
                  
                  // Ensure cursor is positioned
                  const selection = window.getSelection();
                  if (!selection.rangeCount || !detailsArea.contains(selection.anchorNode)) {
                    const range = document.createRange();
                    range.selectNodeContents(detailsArea);
                    range.collapse(false);
                    selection.removeAllRanges();
                    selection.addRange(range);
                  }
                  
                  document.execCommand('insertUnorderedList', false, null);
                }}
                title="Bullet List"
              >
                • Bullets
              </button>
            </div>
            <div 
              className="details-richtext"
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => {
                e.stopPropagation();
                const content = e.currentTarget.innerHTML;
                if (content !== task.details) {
                  updateTaskDetails(listName, index, content);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                
                // Handle Enter key to auto-create new checkboxes
                if (e.key === 'Enter') {
                  const selection = window.getSelection();
                  if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    const currentNode = range.startContainer;
                    
                    // Check if we're in a checkbox-line
                    let checkboxLine = currentNode.nodeType === Node.ELEMENT_NODE ? 
                      currentNode.closest('.checkbox-line') : 
                      currentNode.parentElement?.closest('.checkbox-line');
                    
                    if (checkboxLine) {
                      e.preventDefault();
                      
                      // Create new checkbox line
                      const newCheckboxLine = document.createElement('div');
                      newCheckboxLine.className = 'checkbox-line';
                      newCheckboxLine.style.display = 'block';
                      
                      const newCheckbox = document.createElement('input');
                      newCheckbox.type = 'checkbox';
                      newCheckbox.className = 'task-checkbox';
                      newCheckbox.onclick = (evt) => evt.stopPropagation();
                      
                      const newTextSpan = document.createElement('span');
                      newTextSpan.innerHTML = '&nbsp;';
                      newTextSpan.contentEditable = 'true';
                      
                      newCheckboxLine.appendChild(newCheckbox);
                      newCheckboxLine.appendChild(newTextSpan);
                      
                      // Insert after current checkbox line
                      checkboxLine.parentNode.insertBefore(newCheckboxLine, checkboxLine.nextSibling);
                      
                      // Move cursor to new checkbox line
                      const newRange = document.createRange();
                      newRange.setStart(newTextSpan, 0);
                      newRange.collapse(true);
                      selection.removeAllRanges();
                      selection.addRange(newRange);
                    }
                  }
                }
              }}
              dangerouslySetInnerHTML={{ __html: task.details || '' }}
            />

            <div className="date-project-row">
              <div className="due-date-display">
                <label className="details-label" style={{ margin: 0 }}>Due Date:</label>
                <input
                  type="date"
                  value={task.dueDate || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateTaskDueDate(listName, index, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="due-date-display">
                <label className="details-label" style={{ margin: 0 }}>Project:</label>
                <select
                  value={task.projectId || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    const value = e.target.value;
                    assignTaskToProject(listName, index, value || null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="project-selector"
                >
                  <option value=""></option>
                  {getAllProjects().map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {listName === 'kids' && (
              <div className="date-field">
                <label className="details-label" style={{ margin: 0 }}>Assigned to:</label>
                <select
                  value={task.assignedChild || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    const value = e.target.value;
                    updateTask(listName, index, { assignedChild: value || null });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="project-selector"
                  style={{color: '#7dd3c0'}}
                >
                  <option value=""></option>
                  <option value="Stella">Stella</option>
                  <option value="Liam">Liam</option>
                </select>
              </div>
            )}

            <div className="fire-flag-selector">
              <span 
                className={`fire-flag-icon clickable ${task.priority === 'high' ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateTaskPriority(listName, index, task.priority === 'high' ? 'low' : 'high');
                }}
                title="Pin to top"
              >
                {task.priority === 'high' ? <LitFlame /> : <UnlitFlame />}
              </span>
            </div>

            <div className="date-field">
              <label className="details-label" style={{ margin: 0 }}>Created:</label>
              <span className="date-field-value">{createdDate}</span>
            </div>

            {task.completed && (
              <div className="date-field">
                <label className="details-label" style={{ margin: 0 }}>Completed:</label>
                <span className="date-field-value">{completedDate}</span>
              </div>
            )}

            <div className="task-actions">
              {showMoveButtons && !task.completed && (
                <>
                  {task.section === 'todo' && (
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskToSection(listName, index, 'backlog');
                      }}
                    >
                      → Backlog
                    </button>
                  )}
                  {task.section === 'backlog' && (
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        moveTaskToSection(listName, index, 'todo');
                      }}
                    >
                      → To Do
                    </button>
                  )}
                </>
              )}
              {task.completed && (
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    archiveTask(listName, index);
                  }}
                >
                  Archive
                </button>
              )}
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteTask(listName, index);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const StackedLogs = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bottom log */}
      <ellipse cx="32" cy="50" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="44" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="44" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - bottom log */}
      <line x1="15" y1="46" x2="15" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="46" x2="20" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="46" x2="25" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="46" x2="30" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="46" x2="35" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="46" x2="40" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="46" x2="45" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="46" x2="49" y2="54" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      
      {/* Middle log */}
      <ellipse cx="32" cy="36" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="30" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="30" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - middle log */}
      <line x1="15" y1="32" x2="15" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="32" x2="20" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="32" x2="25" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="32" x2="30" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="32" x2="35" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="32" x2="40" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="32" x2="45" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="32" x2="49" y2="40" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      
      {/* Top log */}
      <ellipse cx="32" cy="22" rx="20" ry="6" fill="#654321"/>
      <rect x="12" y="16" width="40" height="12" rx="2" fill="#8B4513"/>
      <ellipse cx="32" cy="16" rx="20" ry="6" fill="#A0522D"/>
      
      {/* Wood grain lines - top log */}
      <line x1="15" y1="18" x2="15" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="20" y1="18" x2="20" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="25" y1="18" x2="25" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="30" y1="18" x2="30" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="35" y1="18" x2="35" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="40" y1="18" x2="40" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="45" y1="18" x2="45" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
      <line x1="49" y1="18" x2="49" y2="26" stroke="#654321" strokeWidth="0.5" opacity="0.6"/>
    </svg>
  );

  const UnlitFlame = () => (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280.000000 1280.000000"
      preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#666666" stroke="none" opacity="0.4">
        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
        -1 -56z"/>
        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
      </g>
    </svg>
  );

  const LitFlame = () => (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280.000000 1280.000000"
      preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#FF4500" stroke="none">
        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
        -1 -56z"/>
        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
      </g>
    </svg>
  );

  const UnlitTorch = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Torch handle */}
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#8B4513"/>
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#A0522D" opacity="0.6"/>
      
      {/* Torch head (unlit) */}
      <ellipse cx="32" cy="20" rx="10" ry="12" fill="#654321"/>
      <ellipse cx="32" cy="20" rx="8" ry="10" fill="#8B4513"/>
      
      {/* Wrapping texture */}
      <path d="M 28 32 L 28 36 L 36 36 L 36 32" stroke="#654321" strokeWidth="0.5" fill="none"/>
      <path d="M 28 38 L 28 42 L 36 42 L 36 38" stroke="#654321" strokeWidth="0.5" fill="none"/>
    </svg>
  );

  const LitTorch = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Torch handle */}
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#8B4513"/>
      <rect x="28" y="35" width="8" height="25" rx="1" fill="#A0522D" opacity="0.6"/>
      
      {/* Torch head */}
      <ellipse cx="32" cy="22" rx="10" ry="12" fill="#654321"/>
      <ellipse cx="32" cy="22" rx="8" ry="10" fill="#8B4513"/>
      
      {/* Fire - outer flame */}
      <path d="M 32 8 Q 28 11 26 16 Q 24 21 26 26 Q 28 30 32 32 Q 36 30 38 26 Q 40 21 38 16 Q 36 11 32 8 Z" 
            fill="#FF6B35" opacity="0.8"/>
      
      {/* Fire - middle flame */}
      <path d="M 32 10 Q 30 13 29 17 Q 28 21 30 24 Q 31 26 32 27 Q 33 26 34 24 Q 36 21 35 17 Q 34 13 32 10 Z" 
            fill="#FFD93D"/>
      
      {/* Fire - inner flame */}
      <path d="M 32 13 Q 31 15 30.5 18 Q 30 20 31 22 Q 31.5 23 32 23.5 Q 32.5 23 33 22 Q 34 20 33.5 18 Q 33 15 32 13 Z" 
            fill="#FFF4CC"/>
      
      {/* Flickering sparks */}
      <circle cx="28" cy="10" r="1" fill="#FFD93D" opacity="0.8"/>
      <circle cx="36" cy="12" r="0.8" fill="#FFD93D" opacity="0.6"/>
      <circle cx="30" cy="7" r="0.8" fill="#FFF4CC" opacity="0.9"/>
      
      {/* Wrapping texture */}
      <path d="M 28 32 L 28 36 L 36 36 L 36 32" stroke="#654321" strokeWidth="0.5" fill="none"/>
      <path d="M 28 38 L 28 42 L 36 42 L 36 38" stroke="#654321" strokeWidth="0.5" fill="none"/>
    </svg>
  );

  const BurningCampfire = () => (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1280.000000 1280.000000"
      preserveAspectRatio="xMidYMid meet">
      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
        fill="#3a3a4a" stroke="none">
        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
        -1 -56z"/>
        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
        <path d="M9665 3254 c-346 -57 -781 -124 -965 -149 -677 -92 -1035 -163 -1440
        -284 -192 -58 -422 -143 -413 -152 11 -10 304 -98 529 -159 507 -136 1295
        -295 1634 -331 l105 -11 850 186 c468 102 857 190 865 195 22 12 59 123 66
        199 8 79 -12 168 -54 246 -38 72 -154 182 -249 238 -74 44 -269 129 -289 127
        -5 -1 -292 -48 -639 -105z"/>
        <path d="M2494 3104 c-79 -59 -212 -194 -265 -268 -55 -77 -101 -188 -119
        -290 -16 -84 -8 -247 17 -366 l18 -85 130 -12 c396 -37 672 -68 1166 -133 116
        -16 431 -69 590 -100 301 -59 610 -153 1009 -305 412 -157 617 -225 855 -284
        208 -51 314 -70 670 -115 349 -44 526 -68 582 -76 33 -6 94 -15 135 -20 40 -5
        181 -25 313 -45 432 -64 653 -95 833 -115 217 -26 319 -50 627 -151 360 -119
        665 -189 650 -151 -14 36 -55 193 -66 249 -18 97 -7 324 19 400 67 191 225
        344 447 434 83 33 90 38 93 66 l3 30 -113 7 c-98 5 -295 26 -528 56 -89 11
        -387 58 -485 75 -347 64 -588 110 -690 131 -66 13 -164 33 -217 44 -54 11
        -117 24 -140 30 -24 5 -97 21 -163 35 -613 132 -855 195 -1360 350 -269 82
        -575 163 -720 190 -104 20 -118 22 -450 69 -137 19 -297 42 -355 51 -159 23
        -408 57 -770 105 -124 16 -274 37 -335 45 -115 16 -409 55 -750 100 -274 36
        -547 75 -566 81 -9 2 -38 -11 -65 -32z"/>
        <path d="M3290 1695 c-41 -13 -194 -58 -340 -100 -146 -42 -291 -83 -322 -93
        -32 -9 -58 -20 -58 -24 0 -4 5 -8 10 -8 31 0 214 -124 293 -200 111 -104 175
        -199 213 -316 27 -82 29 -100 29 -239 -1 -154 -13 -239 -56 -388 -11 -38 -19
        -72 -17 -76 2 -4 515 197 1141 447 625 250 1135 457 1132 460 -11 11 -785 297
        -965 356 -367 121 -624 176 -925 200 -45 3 -79 -2 -135 -19z"/>
        <path d="M10462 1600 c-116 -31 -205 -84 -302 -180 -70 -69 -95 -101 -128
        -170 -55 -112 -73 -185 -73 -297 -1 -177 42 -294 140 -385 89 -83 151 -103
        321 -103 111 0 147 4 205 22 176 56 325 194 389 362 28 75 30 301 2 401 -42
        154 -134 281 -243 335 -78 39 -202 45 -311 15z"/>
        <path d="M2160 1293 c-261 -34 -422 -173 -485 -418 -19 -76 -20 -300 -1 -372
        48 -178 160 -296 343 -360 74 -26 88 -27 253 -27 162 0 180 2 248 26 134 48
        215 116 271 226 53 105 65 170 65 342 -1 139 -4 162 -27 227 -13 40 -36 92
        -51 116 -62 106 -191 192 -331 222 -76 16 -229 26 -285 18z"/>
      </g>
    </svg>
  );

  const CheckedBox = () => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Rounded checkbox background */}
      <rect x="16" y="16" width="48" height="48" rx="12" ry="12" 
            fill="url(#checkboxGradient)" stroke="#a8e6cf" strokeWidth="3"/>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="checkboxGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7dd3c0"/>
          <stop offset="100%" stopColor="#a8e6cf"/>
        </linearGradient>
      </defs>
      
      {/* Checkmark */}
      <path d="M 26 40 L 36 50 L 54 30" 
            stroke="#1a1a2e" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  const CutLog = () => (
    <svg viewBox="0 0 600 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>{`
          .log { fill: #c0c0c0; stroke: #808080; stroke-width: 8; }
          .ring { fill: #d0d0d0; stroke: #808080; stroke-width: 8; }
          .inner-ring { fill: none; stroke: #808080; stroke-width: 5; }
          .bark { stroke: #707070; stroke-width: 5; stroke-linecap: round; }
          .texture { stroke: #e0e0e0; stroke-width: 4; stroke-linecap: round; opacity: 0.25; }
        `}</style>
      </defs>
      {/* Bottom Left Log - Much Thicker */}
      <g>
        <rect x="120" y="300" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="120" cy="370" r="70" className="ring"/>
        <circle cx="120" cy="370" r="40" className="inner-ring"/>
        <line x1="220" y1="330" x2="310" y2="330" className="bark"/>
        <line x1="250" y1="380" x2="350" y2="380" className="bark"/>
        <line x1="260" y1="410" x2="330" y2="410" className="texture"/>
      </g>
      {/* Bottom Right Log - Much Thicker */}
      <g>
        <rect x="270" y="300" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="270" cy="370" r="70" className="ring"/>
        <circle cx="270" cy="370" r="40" className="inner-ring"/>
        <line x1="370" y1="330" x2="460" y2="330" className="bark"/>
        <line x1="400" y1="380" x2="500" y2="380" className="bark"/>
        <line x1="410" y1="410" x2="480" y2="410" className="texture"/>
      </g>
      {/* Top Center Log - Much Thicker */}
      <g>
        <rect x="195" y="160" rx="70" ry="70" width="340" height="140" className="log"/>
        <circle cx="195" cy="230" r="70" className="ring"/>
        <circle cx="195" cy="230" r="40" className="inner-ring"/>
        <line x1="295" y1="190" x2="385" y2="190" className="bark"/>
        <line x1="325" y1="240" x2="425" y2="240" className="bark"/>
        <line x1="335" y1="270" x2="405" y2="270" className="texture"/>
      </g>
    </svg>
  );

  const renderTasks = () => {
    if (currentList === 'master') {
      const listNames = ['personal', 'work', 'home', 'travel', 'kids'];
      const listLabels = {
        personal: 'Personal Tasks',
        work: 'Work Tasks',
        home: 'Home Projects',
        travel: 'Travel Plans',
        kids: 'Kids Tasks'
      };

      let hasAnyTasks = false;
      const sections = listNames.map(listName => {
        if (!allLists[listName]) return null;
        const tasks = applyFilters(allLists[listName].filter(t => t.section === 'todo' && !t.completed))
          .sort((a, b) => {
            // Sort by priority first (high priority first)
            if (a.priority === 'high' && b.priority !== 'high') return -1;
            if (a.priority !== 'high' && b.priority === 'high') return 1;
            return 0;
          });
        if (tasks.length === 0) return null;
        hasAnyTasks = true;

        return (
          <div key={listName} className="list-section">
            <div className="list-section-header">
              <span>{listLabels[listName]}</span>
              <span className={`badge ${listName}`}>{tasks.length}</span>
            </div>
            {tasks.map((task) => {
              const actualIndex = task.isArchived 
                ? archivedTasks[listName]?.indexOf(task) ?? -1
                : allLists[listName].indexOf(task);
              return (
                <div key={task.id} style={{position: 'relative'}}>
                  {task.isArchived && (
                    <div className="archived-indicator">📦 Archived</div>
                  )}
                  <Task
                    key={task.id}
                    task={task}
                    listName={listName}
                    index={actualIndex}
                    showMoveButtons={true}
                  />
                </div>
              );
            })}
          </div>
        );
      });

      if (!hasAnyTasks) {
        return (
          <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
            <div style={{
              width: '180px',
              height: '180px',
              position: 'relative',
              display: 'inline-block'
            }}>
              {/* Background circle */}
              <svg 
                style={{
                  position: 'absolute',
                  top: '-15px',
                  left: '-15px',
                  width: '210px',
                  height: '210px',
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                <circle
                  cx="105"
                  cy="105"
                  r="95"
                  fill="none"
                  stroke="rgba(58, 58, 74, 0.3)"
                  strokeWidth="8"
                />
              </svg>
              
              {/* Dark Fire Icon */}
              <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1280.000000 1280.000000"
                preserveAspectRatio="xMidYMid meet"
                style={{
                  width: '100%',
                  height: '100%',
                  filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                }}>
                <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                  fill="#3a3a4a" stroke="none">
                  <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                  -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                  -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                  17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                  -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                  132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                  680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                  -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                  -1 -56z"/>
                  <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                  -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                  -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                  -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                  289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                  553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                  -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                  <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                  -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                  -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                  -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                  36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                  -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                  95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                </g>
              </svg>
            </div>
          </div>
        );
      }

      return sections;
    } else {
      const allTasks = getCurrentTasks();
      const todoTasks = allTasks.filter(t => t.section === 'todo' && !t.completed).sort((a, b) => {
        // Pin high priority (fire flag) tasks to the top
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
      });
      const backlogTasks = allTasks.filter(t => t.section === 'backlog' && !t.completed).sort((a, b) => {
        // Pin high priority (fire flag) tasks to the top
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        return 0;
      });
      const completedTasks = allTasks.filter(t => t.completed);

      return (
        <>
          <div className="list-section">
            <div className="list-section-header">
              <span className="section-icon campfire-icon"><BurningCampfire /></span>
              <span>To Do</span>
              <span className="badge work">{todoTasks.length}</span>
            </div>
            {todoTasks.length === 0 ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  {/* Background circle */}
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '140px',
                      height: '140px',
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r="63"
                      fill="none"
                      stroke="rgba(58, 58, 74, 0.3)"
                      strokeWidth="6"
                    />
                  </svg>
                  
                  {/* Dark Fire Icon */}
                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1280.000000 1280.000000"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      width: '100%',
                      height: '100%',
                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                    }}>
                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                      fill="#3a3a4a" stroke="none">
                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      0 -151z"/>
                    </g>
                  </svg>
                </div>
              </div>
            ) : (
              todoTasks.map((task) => {
                const actualIndex = allLists[currentList].indexOf(task);
                return (
                  <Task
                    key={task.id}
                    task={task}
                    listName={currentList}
                    index={actualIndex}
                    showMoveButtons={true}
                  />
                );
              })
            )}
          </div>

          <div className="list-section">
            <div className="list-section-header">
              <span className="section-icon logs-icon"><CutLog /></span>
              <span>Backlog</span>
              <span className="badge personal">{backlogTasks.length}</span>
            </div>
            {backlogTasks.length === 0 ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  {/* Background circle */}
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '140px',
                      height: '140px',
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r="63"
                      fill="none"
                      stroke="rgba(58, 58, 74, 0.3)"
                      strokeWidth="6"
                    />
                  </svg>
                  
                  {/* Dark Fire Icon */}
                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1280.000000 1280.000000"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      width: '100%',
                      height: '100%',
                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                    }}>
                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                      fill="#3a3a4a" stroke="none">
                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      0 -151z"/>
                    </g>
                  </svg>
                </div>
              </div>
            ) : (
              backlogTasks.map((task) => {
                const actualIndex = allLists[currentList].indexOf(task);
                return (
                  <Task
                    key={task.id}
                    task={task}
                    listName={currentList}
                    index={actualIndex}
                    showMoveButtons={true}
                  />
                );
              })
            )}
          </div>

          <div className="list-section">
            <div className="list-section-header">
              <span className="section-icon checkbox-icon"><CheckedBox /></span>
              <span>Complete</span>
              <span className="badge home">{completedTasks.length}</span>
            </div>
            {completedTasks.length === 0 ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  {/* Background circle */}
                  <svg 
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '-10px',
                      width: '140px',
                      height: '140px',
                      transform: 'rotate(-90deg)',
                      pointerEvents: 'none'
                    }}
                  >
                    <circle
                      cx="70"
                      cy="70"
                      r="63"
                      fill="none"
                      stroke="rgba(58, 58, 74, 0.3)"
                      strokeWidth="6"
                    />
                  </svg>
                  
                  {/* Dark Fire Icon */}
                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 1280.000000 1280.000000"
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      width: '100%',
                      height: '100%',
                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                    }}>
                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                      fill="#3a3a4a" stroke="none">
                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      0 -151z"/>
                    </g>
                  </svg>
                </div>
              </div>
            ) : (
              completedTasks.map((task) => {
                const actualIndex = allLists[currentList].indexOf(task);
                return (
                  <Task
                    key={task.id}
                    task={task}
                    listName={currentList}
                    index={actualIndex}
                    showMoveButtons={true}
                  />
                );
              })
            )}
          </div>
        </>
      );
    }
  };

  return (
    <div className="little-fires-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Nunito:wght@400;600;700;800&display=swap');

        .little-fires-container {
          font-family: 'Nunito', sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #2d2d44 50%, #3a3a52 100%);
          color: #f4e8d8;
          min-height: 100vh;
          padding: 40px 20px;
          position: relative;
          overflow-x: hidden;
        }

        .little-fires-container::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(125, 211, 192, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(127, 176, 105, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 230, 207, 0.08) 0%, transparent 50%);
          animation: float 20s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(5deg); }
          66% { transform: translate(-20px, 20px) rotate(-5deg); }
        }

        @keyframes flameGlow {
          0% { 
            filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.8));
          }
          50% { 
            filter: drop-shadow(0 0 45px rgba(255, 69, 0, 1)) drop-shadow(0 0 60px rgba(255, 100, 0, 0.6));
          }
          100% { 
            filter: drop-shadow(0 0 25px rgba(255, 69, 0, 0.8));
          }
        }

        @keyframes progressRing {
          0% {
            stroke-dashoffset: 597;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .hamburger-menu {
          position: absolute;
          top: 20px;
          left: 20px;
          cursor: pointer;
          z-index: 100;
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 10px;
          background: rgba(42, 42, 62, 0.8);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 2px solid rgba(100, 116, 139, 0.3);
          transition: all 0.3s ease;
        }

        .hamburger-icon:hover {
          border-color: rgba(100, 116, 139, 0.6);
          transform: scale(1.05);
        }

        .hamburger-line {
          width: 28px;
          height: 3px;
          background: #B8B8B8;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .menu-dropdown {
          position: absolute;
          top: 70px;
          left: 20px;
          background: rgba(42, 42, 62, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          border: 2px solid rgba(100, 116, 139, 0.4);
          padding: 10px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
          z-index: 99;
        }

        .menu-item {
          padding: 12px 24px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.3s ease;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 1rem;
          color: #f4e8d8;
        }

        .menu-item:hover {
          background: rgba(100, 116, 139, 0.3);
        }

        .menu-item.active {
          background: rgba(125, 211, 192, 0.2);
          color: #7dd3c0;
        }

        .menu-divider {
          height: 1px;
          background: rgba(244, 232, 216, 0.3);
          margin: 8px 16px;
        }

        header {
          text-align: center;
          margin-bottom: 35px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }

        h1 {
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 3.5rem;
          letter-spacing: 2px;
          color: #000000;
          filter: drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.2));
          margin: 0;
          animation: blackGlow 4s ease-in-out infinite;
        }

        @keyframes blackGlow {
          0%, 100% {
            filter: drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.2));
            text-shadow: 0 0 2px rgba(0, 0, 0, 0.1);
          }
          50% {
            filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3)) drop-shadow(0 0 8px rgba(45, 106, 79, 0.2));
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.2), 0 0 8px rgba(45, 106, 79, 0.15);
          }
        }

        .subtitle {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .subtitle svg {
          filter: drop-shadow(2px 4px 4px rgba(0, 0, 0, 0.2));
          animation: blackGlow 4s ease-in-out infinite;
        }

        .tabs-container {
          margin-bottom: 20px;
        }

        .master-tab {
          width: 70%;
          margin: 0 auto 10px auto;
          display: block;
        }

        .master-tab.active {
          border: 3px solid rgba(255, 107, 53, 0.8);
          box-shadow: 0 0 12px rgba(255, 107, 53, 0.7), 0 0 20px rgba(255, 142, 83, 0.5), 0 0 30px rgba(255, 107, 53, 0.3);
        }

        .tabs {
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .tab {
          background: rgba(42, 42, 62, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(125, 211, 192, 0.2);
          padding: 12px 24px;
          color: #f4e8d8;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border-radius: 30px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .tab:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(125, 211, 192, 0.3);
          background: rgba(52, 52, 72, 0.9);
          border-color: rgba(125, 211, 192, 0.4);
        }

        .tab.active {
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          color: #fff;
          box-shadow: 0 0 8px rgba(71, 85, 105, 0.6), 0 0 12px rgba(100, 116, 139, 0.4);
          transform: scale(1.05);
          border: 2px solid rgba(100, 116, 139, 0.5);
        }

        .search-filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .search-filter-bar.hidden {
          display: none;
        }

        .search-box {
          flex: 1;
          background: rgba(42, 42, 62, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 25px;
          padding: 12px 20px;
          color: #f4e8d8;
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
        }

        .search-box:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 20px rgba(125, 211, 192, 0.3);
        }

        .input-container {
          margin-bottom: 25px;
        }

        .input-container.hidden {
          display: none;
        }

        .task-input-wrapper {
          display: flex;
          gap: 12px;
          margin-bottom: 15px;
        }

        input[type="text"], input[type="date"] {
          background: rgba(42, 42, 62, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 25px;
          padding: 16px 24px;
          color: #f4e8d8;
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        input[type="text"] {
          flex: 1;
        }

        input[type="text"]:focus, input[type="date"]:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 30px rgba(125, 211, 192, 0.4);
          transform: translateY(-2px);
        }

        input[type="text"]::placeholder {
          color: #b8a99a;
          opacity: 0.6;
        }

        input[type="date"] {
          padding: 12px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .project-selector {
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 20px;
          padding: 12px 16px;
          color: #7dd3c0;
          font-family: 'Nunito', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
          min-width: 150px;
        }

        .project-selector:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 20px rgba(125, 211, 192, 0.3);
        }

        .project-selector option {
          background: #2a2a3e;
          color: #7dd3c0;
        }

        .task-options {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }

        .fire-flag-selector {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .child-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .child-btn {
          padding: 8px 16px;
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.3);
          border-radius: 10px;
          color: #7dd3c0;
          font-family: 'Quicksand', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .child-btn:hover {
          border-color: rgba(125, 211, 192, 0.6);
          transform: translateY(-2px);
        }

        .child-btn.active {
          background: linear-gradient(135deg, #5ab9a8, #7dd3c0);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 4px 15px rgba(125, 211, 192, 0.4);
        }

        .fire-flag-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          user-select: none;
        }

        .fire-flag-icon svg {
          width: 100%;
          height: 100%;
        }

        .fire-flag-icon.clickable {
          cursor: pointer;
          opacity: 0.7;
        }

        .fire-flag-icon.clickable:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .fire-flag-icon.clickable.active {
          opacity: 1;
        }

        .section-selector, .priority-selector {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .section-selector label, .priority-selector label {
          font-size: 0.85rem;
          color: #b8a99a;
          font-weight: 600;
        }

        .section-btn {
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.2);
          padding: 8px 16px;
          color: #f4e8d8;
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 15px;
        }

        .section-btn:hover {
          background: rgba(52, 52, 72, 0.9);
          border-color: rgba(125, 211, 192, 0.4);
          transform: scale(1.05);
        }

        .section-btn.selected {
          background: linear-gradient(135deg, #5fb49c, #7dd3c0);
          color: #1a1a2e;
          border-color: transparent;
        }

        .priority-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .priority-btn.high {
          background: #ff6b6b;
        }

        .priority-btn.medium {
          background: #ffd93d;
        }

        .priority-btn.low {
          background: #6bcf7f;
        }

        .priority-btn:hover {
          transform: scale(1.1);
        }

        .priority-btn.selected {
          border-color: #f4e8d8;
          box-shadow: 0 0 15px currentColor;
        }

        button {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
          border: none;
          border-radius: 25px;
          padding: 16px 32px;
          color: #1a1a2e;
          font-family: 'Quicksand', sans-serif;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 6px 20px rgba(125, 211, 192, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        button:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(125, 211, 192, 0.6);
        }

        .add-task-btn {
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          color: #fff;
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.4);
        }

        .add-task-btn:hover {
          box-shadow: 0 8px 30px rgba(45, 106, 79, 0.6);
        }

        .fire-flag-btn {
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          outline: none;
        }

        .fire-flag-btn:hover {
          border-color: rgba(255, 107, 107, 0.5);
          transform: scale(1.05);
        }

        .fire-flag-btn.active {
          background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }

        .tasks-container {
          background: rgba(30, 30, 46, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 25px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          border: 2px solid rgba(125, 211, 192, 0.1);
          max-height: 600px;
          overflow-y: auto;
        }

        .tasks-container::-webkit-scrollbar {
          width: 8px;
        }

        .tasks-container::-webkit-scrollbar-track {
          background: rgba(125, 211, 192, 0.1);
          border-radius: 10px;
        }

        .tasks-container::-webkit-scrollbar-thumb {
          background: #7dd3c0;
          border-radius: 10px;
        }

        .list-section {
          margin-bottom: 30px;
        }

        .list-section-header {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #f4e8d8;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 4px solid rgba(125, 211, 192, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-icon {
          width: 3.2rem;
          height: 3.2rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .section-icon svg {
          width: 100%;
          height: 100%;
        }

        .campfire-icon svg {
          filter: drop-shadow(0 0 8px rgba(139, 35, 0, 0.6)) drop-shadow(0 0 12px rgba(205, 50, 0, 0.4));
        }

        .logs-icon {
          width: 4.5rem;
          height: 4.5rem;
        }

        .logs-icon svg {
          filter: drop-shadow(0 0 6px rgba(128, 128, 128, 0.5)) drop-shadow(0 0 10px rgba(160, 160, 160, 0.3));
        }

        .checkbox-icon svg {
          filter: drop-shadow(0 0 6px rgba(125, 211, 192, 0.5)) drop-shadow(0 0 10px rgba(168, 230, 207, 0.3));
        }

        .list-section-header .badge {
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 600;
          margin-left: auto;
        }

        .badge.personal {
          background: linear-gradient(135deg, #7fb069, #6a9d5f);
        }

        .badge.work {
          background: linear-gradient(135deg, #6b8f5a, #5a7a4a);
        }

        .badge.home {
          background: linear-gradient(135deg, #3d6b2f, #2d5a1f);
        }

        .badge.travel {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
        }

        .badge.kids {
          background: linear-gradient(135deg, #a78bfa, #c084fc);
        }

        .task {
          background: rgba(52, 52, 72, 0.6);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(125, 211, 192, 0.15);
          border-radius: 15px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          cursor: pointer;
          position: relative;
        }

        .task.expanded {
          cursor: default;
        }

        .task:not(.expanded):hover {
          background: rgba(62, 62, 82, 0.8);
          border-color: rgba(125, 211, 192, 0.3);
          transform: translateX(5px);
          box-shadow: 0 4px 20px rgba(125, 211, 192, 0.2);
        }

        .task.completed {
          opacity: 0.6;
          background: rgba(42, 42, 62, 0.4);
        }

        .task.completed .task-text {
          text-decoration: line-through;
          opacity: 0.7;
        }

        .priority-indicator {
          width: 8px;
          height: 100%;
          position: absolute;
          left: 0;
          top: 0;
          border-radius: 15px 0 0 15px;
          display: none;
        }

        .task.expanded .priority-indicator {
          display: block;
        }

        .priority-indicator.high {
          background: #ff6b6b;
        }

        .priority-indicator.medium {
          background: #ffd93d;
        }

        .priority-indicator.low {
          background: #6bcf7f;
        }

        .task-main {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .checkbox-wrapper input[type="checkbox"] {
          appearance: none;
          width: 24px;
          height: 24px;
          border: 2px solid #7dd3c0;
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          background: transparent;
        }

        .checkbox-wrapper input[type="checkbox"]:checked {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
          border-color: #a8e6cf;
        }

        .checkbox-wrapper input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1a1a2e;
          font-weight: bold;
          font-size: 14px;
        }

        .task-content {
          flex: 1;
        }

        .task-text {
          color: #f4e8d8;
          font-size: 1rem;
          font-weight: 500;
          word-break: break-word;
        }

        .pinned-flame {
          display: inline-flex;
          align-items: center;
          vertical-align: middle;
        }

        .pinned-flame-right {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          flex-shrink: 0;
        }

        .task-meta {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
          font-size: 0.8rem;
          color: #b8a99a;
          margin-top: 6px;
        }

        .task-priority-label {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          display: none;
        }

        .task.expanded .task-priority-label {
          display: inline-block;
        }

        .task-priority-label.high {
          background: rgba(255, 107, 107, 0.2);
          color: #ff6b6b;
        }

        .task-priority-label.medium {
          background: rgba(255, 217, 61, 0.2);
          color: #ffd93d;
        }

        .task-priority-label.low {
          background: rgba(107, 207, 127, 0.2);
          color: #6bcf7f;
        }

        .task-due-date {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .task-due-date.overdue {
          color: #ff6b6b;
          font-weight: 600;
        }

        .task-details-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid rgba(125, 211, 192, 0.2);
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .details-label {
          font-size: 0.85rem;
          color: #b8a99a;
          font-weight: 600;
          margin-bottom: 8px;
          display: block;
        }

        .details-textarea {
          width: 100%;
          background: rgba(30, 30, 46, 0.6);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #f4e8d8;
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          outline: none;
          resize: vertical;
          min-height: 100px;
          transition: all 0.3s ease;
        }

        .details-textarea:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 20px rgba(125, 211, 192, 0.3);
        }

        .details-richtext {
          width: 100%;
          background: rgba(30, 30, 46, 0.6);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #f4e8d8;
          font-family: 'Nunito', sans-serif;
          font-size: 0.95rem;
          outline: none;
          min-height: 100px;
          max-height: 300px;
          overflow-y: auto;
          transition: all 0.3s ease;
        }

        .details-richtext:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 20px rgba(125, 211, 192, 0.3);
        }

        .details-richtext:empty:before {
          content: 'Add details about this task...';
          color: #b8a99a;
          opacity: 0.6;
          pointer-events: none;
        }

        .details-richtext ul,
        .details-richtext ol {
          margin: 10px 0;
          padding-left: 30px;
          color: #f4e8d8 !important;
          list-style-position: outside;
        }

        .details-richtext ul {
          list-style-type: disc;
        }

        .details-richtext ol {
          list-style-type: decimal;
        }

        .details-richtext li {
          margin: 5px 0;
          color: #f4e8d8 !important;
          display: list-item;
        }

        .details-richtext li::marker {
          color: #7dd3c0 !important;
          font-weight: bold;
        }

        .details-richtext .task-checkbox {
          appearance: none;
          margin-right: 8px;
          width: 20px;
          height: 20px;
          cursor: pointer;
          vertical-align: middle;
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.3);
          border-radius: 8px;
          transition: all 0.3s ease;
          position: relative;
          flex-shrink: 0;
        }

        .details-richtext .task-checkbox:hover {
          border-color: rgba(125, 211, 192, 0.5);
          transform: scale(1.1);
        }

        .details-richtext .task-checkbox:checked {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
          border-color: #a8e6cf;
        }

        .details-richtext .task-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1a1a2e;
          font-weight: bold;
          font-size: 14px;
        }

        .details-richtext .checkbox-line {
          display: flex;
          align-items: flex-start;
          margin: 5px 0;
          gap: 8px;
          clear: both;
          width: 100%;
        }

        .details-richtext .checkbox-line::before {
          content: '';
          display: block;
        }

        .details-richtext .checkbox-line::after {
          content: '';
          display: block;
          clear: both;
        }

        .details-richtext .checkbox-line span {
          flex: 1;
          color: #f4e8d8;
        }

        .details-richtext strong {
          font-weight: 700;
          color: #fff;
        }

        .details-richtext em {
          font-style: italic;
          color: #ffd93d;
        }

        .richtext-toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          padding: 5px;
          background: rgba(42, 42, 62, 0.5);
          border-radius: 8px;
        }

        .toolbar-btn {
          padding: 6px 12px;
          background: rgba(125, 211, 192, 0.2);
          border: 1px solid rgba(125, 211, 192, 0.3);
          border-radius: 5px;
          color: #f4e8d8;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .toolbar-btn:hover {
          background: rgba(125, 211, 192, 0.3);
          border-color: rgba(125, 211, 192, 0.5);
        }

        .toolbar-btn:active {
          transform: scale(0.95);
        }

        .task-priority-selector {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .task-priority-selector .priority-btn {
          width: 28px;
          height: 28px;
        }

        .due-date-display {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          color: #b8a99a;
        }

        .date-project-row {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .date-project-row .due-date-display {
          margin-top: 0;
          flex: 1;
          min-width: 200px;
        }

        .date-field {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #b8a99a;
        }

        .date-field-value {
          color: #f4e8d8;
          font-weight: 500;
        }

        .task-actions {
          display: flex;
          gap: 15px;
          margin-top: 15px;
          justify-content: flex-end;
        }

        .delete-btn, .edit-btn {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 10px;
          padding: 8px 14px;
          color: #ff6b6b;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
          text-transform: none;
          letter-spacing: 0;
          box-shadow: none;
        }

        .edit-btn {
          background: rgba(125, 211, 192, 0.2);
          border-color: rgba(125, 211, 192, 0.3);
          color: #7dd3c0;
        }

        .delete-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.05);
        }

        .edit-btn:hover {
          background: rgba(125, 211, 192, 0.3);
          transform: scale(1.05);
        }

        .note-images {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .note-image-container {
          position: relative;
          background: rgba(30, 30, 46, 0.6);
          border-radius: 12px;
          padding: 15px;
          border: 2px solid rgba(100, 116, 139, 0.2);
        }

        .note-image {
          max-width: 100%;
          border-radius: 8px;
          display: block;
        }

        .remove-image-btn {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(220, 38, 38, 0.9);
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          color: white;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0;
        }

        .note-image-container:hover .remove-image-btn {
          opacity: 1;
        }

        .remove-image-btn:hover {
          background: rgba(220, 38, 38, 1);
          transform: scale(1.1);
        }

        .ocr-status {
          margin-top: 10px;
          padding: 8px 12px;
          background: rgba(125, 211, 192, 0.2);
          border-radius: 8px;
          color: #7dd3c0;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: center;
        }

        .extracted-text {
          margin-top: 10px;
          padding: 12px;
          background: rgba(42, 42, 62, 0.6);
          border-radius: 8px;
          border-left: 4px solid #7dd3c0;
        }

        .extracted-text-label {
          color: #7dd3c0;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .extracted-text-content {
          color: #f4e8d8;
          font-size: 0.9rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-state-icon {
          font-size: 4rem;
          margin-bottom: 15px;
          opacity: 0.7;
        }

        .empty-state-text {
          font-size: 1.2rem;
          color: #b8a99a;
          font-weight: 600;
        }

        .archive-section {
          margin-top: 30px;
        }

        .archived-tasks-container {
          margin-top: 30px;
        }

        .archive-list-section {
          margin-bottom: 40px;
        }

        .archive-list-section .section-header {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #f4e8d8;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 4px solid rgba(125, 211, 192, 0.3);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .archived-task {
          background: rgba(42, 42, 62, 0.4);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .archived-task:hover {
          border-color: rgba(100, 116, 139, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .archived-task .task-text {
          color: #f4e8d8;
          font-size: 1.1rem;
          margin-bottom: 10px;
          opacity: 0.7;
        }

        .archived-task .task-meta {
          display: flex;
          gap: 15px;
          margin-bottom: 15px;
        }

        .archived-date {
          color: #7dd3c0;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .archived-task-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .notes-section {
          margin-top: 30px;
        }

        .projects-section {
          margin-top: 30px;
        }

        .goals-section {
          margin-top: 30px;
        }

        .goals-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 20px;
        }

        .goal-card {
          background: rgba(52, 52, 72, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(125, 211, 192, 0.3);
          transition: all 0.3s ease;
        }

        .goal-card:hover {
          border-color: rgba(125, 211, 192, 0.5);
          transform: translateY(-2px);
        }

        .goal-header {
          cursor: pointer;
          margin-bottom: 15px;
        }

        .goal-header h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.4rem;
          color: #f4e8d8;
          margin: 0 0 8px 0;
        }

        .goal-project-count {
          color: #7dd3c0;
          font-size: 0.9rem;
          font-weight: 600;
          background: rgba(125, 211, 192, 0.2);
          padding: 4px 12px;
          border-radius: 12px;
        }

        .goal-actions {
          display: flex;
          gap: 10px;
        }

        .project-detail {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          z-index: 1000;
          padding: 40px 20px;
        }

        .project-detail-content {
          max-width: 800px;
          width: 100%;
          background: #1e1e2e;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .goal-detail {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow-y: auto;
          z-index: 1000;
          padding: 40px 20px;
        }

        .goal-detail-content {
          max-width: 800px;
          width: 100%;
          background: #1e1e2e;
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }

        .goal-projects-section {
          margin-top: 30px;
          padding: 20px;
          background: rgba(42, 42, 62, 0.4);
          border-radius: 15px;
          border: 2px solid rgba(125, 211, 192, 0.3);
        }

        .projects-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .projects-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 2rem;
          color: #f4e8d8;
          margin: 0;
        }

        .projects-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .project-card {
          background: rgba(52, 52, 72, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(100, 116, 139, 0.2);
          transition: all 0.3s ease;
        }

        .project-card:hover {
          border-color: rgba(100, 116, 139, 0.4);
          transform: translateY(-2px);
        }

        .project-header {
          cursor: pointer;
          margin-bottom: 15px;
        }

        .project-header h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.4rem;
          color: #f4e8d8;
          margin: 0 0 8px 0;
        }

        .project-description {
          color: #b8a99a;
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.5;
        }

        .project-meta {
          display: flex;
          gap: 15px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .project-due-date {
          padding: 4px 12px;
          background: rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          color: #7dd3c0;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .project-task-count {
          padding: 4px 12px;
          background: rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          color: #f4e8d8;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .project-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
        }

        .project-detail-header {
          margin-bottom: 25px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .project-detail-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #f4e8d8;
          margin: 15px 0 0 0;
          text-align: center;
        }

        .project-detail-name {
          font-family: 'Quicksand', sans-serif;
        }

        .project-name-edit {
          font-family: 'Quicksand', sans-serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: #f4e8d8;
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          text-align: center;
          outline: none;
          margin: 15px 0 0 0;
          min-width: 300px;
        }

        .project-name-edit:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 15px rgba(125, 211, 192, 0.3);
        }

        .project-dates-section {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin: 20px 0;
          padding: 15px;
          background: rgba(42, 42, 62, 0.5);
          border-radius: 12px;
          border: 2px solid rgba(100, 116, 139, 0.3);
        }

        .project-date-field {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1 1 auto;
          min-width: 180px;
          max-width: 100%;
        }

        .project-date-field input[type="date"] {
          flex: 1;
          min-width: 0;
          max-width: 100%;
        }

        .project-date-label {
          font-family: 'Quicksand', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #b8a99a;
          white-space: nowrap;
        }

        .project-name-edit:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 15px rgba(125, 211, 192, 0.3);
        }

        .back-btn {
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          color: #f4e8d8;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
          align-self: flex-start;
        }

        .back-btn:hover {
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          border-color: transparent;
        }

        .project-task-input {
          background: rgba(52, 52, 72, 0.6);
          border: 2px solid rgba(100, 116, 139, 0.2);
          border-radius: 20px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .project-detail-description {
          color: #b8a99a;
          font-size: 1.05rem;
          line-height: 1.6;
          margin-bottom: 30px;
          padding: 15px;
          background: rgba(42, 42, 62, 0.4);
          border-radius: 12px;
        }

        .project-actions {
          display: flex;
          gap: 10px;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid rgba(100, 116, 139, 0.3);
          justify-content: flex-end;
        }

        .cancel-project-btn {
          padding: 8px 14px;
          background: rgba(125, 211, 192, 0.2);
          border: 1px solid rgba(125, 211, 192, 0.3);
          border-radius: 10px;
          color: #7dd3c0;
          font-family: 'Quicksand', sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
          letter-spacing: normal;
          box-shadow: none;
        }

        .cancel-project-btn:hover {
          background: rgba(125, 211, 192, 0.3);
          transform: scale(1.05);
        }

        .delete-project-btn {
          padding: 8px 16px;
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.3);
          border-radius: 10px;
          color: #ff6b6b;
          font-family: 'Quicksand', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: none;
          letter-spacing: normal;
          box-shadow: none;
        }

        .delete-project-btn:hover {
          background: rgba(255, 107, 107, 0.3);
          transform: scale(1.05);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }

        .modal-content {
          background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
          border: 2px solid rgba(100, 116, 139, 0.4);
          border-radius: 20px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .modal-content h3 {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.8rem;
          color: #f4e8d8;
          margin: 0 0 25px 0;
        }

        .form-field {
          margin-bottom: 20px;
        }

        .form-field label {
          display: block;
          color: #7dd3c0;
          font-size: 0.95rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .form-field input[type="text"],
        .form-field input[type="date"],
        .form-field textarea {
          width: 100%;
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          color: #f4e8d8;
          font-family: 'Nunito', sans-serif;
          font-size: 1rem;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .form-field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-field input:focus,
        .form-field textarea:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 15px rgba(125, 211, 192, 0.3);
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 25px;
        }

        .notes-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .notes-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 2rem;
          color: #f4e8d8;
          margin: 0;
        }

        .notes-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px 40px;
          min-height: 400px;
        }

        .note-entry {
          background: rgba(52, 52, 72, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 20px;
          border: 2px solid rgba(100, 116, 139, 0.2);
          transition: all 0.3s ease;
        }

        .note-entry:hover {
          border-color: rgba(100, 116, 139, 0.4);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(100, 116, 139, 0.2);
          margin-bottom: 15px;
        }

        .note-date {
          font-family: 'Quicksand', sans-serif;
          font-weight: 600;
          font-size: 1.1rem;
          color: #7dd3c0;
        }

        .note-toggle {
          font-size: 0.9rem;
          color: #999;
        }

        .note-content {
          background: rgba(30, 30, 46, 0.6);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          padding: 20px;
          color: #f4e8d8;
          font-size: 1rem;
          line-height: 1.8;
          min-height: 150px;
          max-height: 500px;
          overflow-y: auto;
          transition: all 0.3s ease;
          font-family: 'Nunito', sans-serif;
        }

        .note-content:focus {
          outline: none;
          border-color: #7dd3c0;
          box-shadow: 0 0 15px rgba(125, 211, 192, 0.3);
        }

        .note-content:empty:before {
          content: 'Write your thoughts here...';
          color: #666;
        }

        .tag-filter-bar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(42, 42, 62, 0.6);
          border-radius: 15px;
        }

        .tag-pill {
          padding: 6px 14px;
          background: rgba(100, 116, 139, 0.3);
          border: 2px solid rgba(100, 116, 139, 0.4);
          border-radius: 20px;
          color: #f4e8d8;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Nunito', sans-serif;
          font-weight: 600;
        }

        .tag-pill:hover {
          background: rgba(100, 116, 139, 0.5);
          transform: scale(1.05);
        }

        .tag-pill.active {
          background: linear-gradient(135deg, #5ab9a8, #7dd3c0);
          border-color: transparent;
          color: #fff;
        }

        .note-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: linear-gradient(135deg, #5ab9a8, #7dd3c0);
          border-radius: 15px;
          color: #fff;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .tag-remove {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: 50%;
          width: 18px;
          height: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #fff;
          font-size: 16px;
          line-height: 1;
          transition: all 0.2s ease;
          padding: 0;
        }

        .tag-remove:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(1.1);
        }

        .tag-input {
          background: rgba(30, 30, 46, 0.6);
          border: 2px solid rgba(125, 211, 192, 0.2);
          border-radius: 12px;
          padding: 8px 14px;
          color: #f4e8d8;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.3s ease;
          font-family: 'Nunito', sans-serif;
          width: 100%;
        }

        .tag-input:focus {
          border-color: #7dd3c0;
          box-shadow: 0 0 10px rgba(125, 211, 192, 0.3);
        }

        .calendar-section {
          margin-top: 30px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .calendar-header h2 {
          font-family: 'Quicksand', sans-serif;
          font-size: 2rem;
          color: #f4e8d8;
          margin: 0;
        }

        .calendar-controls {
          margin-bottom: 20px;
          display: flex;
          gap: 20px;
          justify-content: center;
        }

        .calendar-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #f4e8d8;
          font-size: 0.95rem;
          font-weight: 600;
          padding: 8px 16px;
          background: rgba(42, 42, 62, 0.6);
          border-radius: 12px;
          border: 2px solid rgba(100, 116, 139, 0.3);
          transition: all 0.3s ease;
        }

        .calendar-checkbox:hover {
          border-color: rgba(100, 116, 139, 0.6);
          background: rgba(52, 52, 72, 0.8);
        }

        .calendar-checkbox input[type="checkbox"] {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(125, 211, 192, 0.4);
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          background: rgba(30, 30, 46, 0.6);
          transition: all 0.3s ease;
        }

        .calendar-checkbox input[type="checkbox"]:checked {
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          border-color: #40916C;
        }

        .calendar-checkbox input[type="checkbox"]:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #fff;
          font-size: 12px;
          font-weight: bold;
        }

        .month-nav-btn {
          background: rgba(42, 42, 62, 0.8);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 12px;
          padding: 10px 20px;
          color: #f4e8d8;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .month-nav-btn:hover {
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          border-color: transparent;
          transform: scale(1.1);
        }

        .calendar-container {
          position: relative;
        }

        .project-timelines {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          pointer-events: none;
          z-index: 1;
        }

        .project-timeline-bar {
          height: 6px;
          border-radius: 3px;
          margin-top: 30px;
          align-self: end;
          margin-bottom: 8px;
          position: relative;
          opacity: 0.85;
          transition: opacity 0.2s ease;
          pointer-events: auto;
          cursor: pointer;
        }

        .project-timeline-bar:hover {
          opacity: 1;
        }

        .project-timeline-label {
          position: absolute;
          left: 4px;
          top: -20px;
          font-size: 0.7rem;
          font-weight: 600;
          color: #f4e8d8;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
          pointer-events: none;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 30px;
          position: relative;
          z-index: 2;
        }

        .calendar-day-header {
          text-align: center;
          font-weight: 700;
          color: #7dd3c0;
          padding: 10px;
          font-size: 0.9rem;
        }

        .calendar-day {
          aspect-ratio: 1;
          background: rgba(52, 52, 72, 0.6);
          border: 2px solid rgba(100, 116, 139, 0.2);
          border-radius: 12px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
        }

        .calendar-day.empty {
          background: transparent;
          border: none;
          cursor: default;
        }

        .calendar-day:not(.empty):hover {
          border-color: rgba(100, 116, 139, 0.6);
          transform: scale(1.05);
        }

        .calendar-day.today {
          border-color: #7dd3c0;
          background: rgba(125, 211, 192, 0.1);
        }

        .calendar-day.selected {
          background: linear-gradient(135deg, rgba(45, 106, 79, 0.3), rgba(64, 145, 108, 0.3));
          border-color: #40916C;
        }

        .calendar-day.has-items {
          background: rgba(52, 52, 72, 0.8);
        }

        .day-number {
          font-size: 1.1rem;
          font-weight: 600;
          color: #f4e8d8;
          margin-bottom: 4px;
        }

        .day-indicators {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-top: auto;
          align-items: center;
        }

        .indicator {
          font-size: 0.6rem;
        }

        .task-indicator {
          color: #7dd3c0;
        }

        .note-indicator {
          color: #1E3A8A;
        }

        .project-indicator {
          color: #9333EA;
        }

        .day-details {
          background: rgba(52, 52, 72, 0.6);
          border: 2px solid rgba(100, 116, 139, 0.3);
          border-radius: 20px;
          padding: 25px;
        }

        .day-details h3 {
          font-family: 'Quicksand', sans-serif;
          color: #7dd3c0;
          margin: 0 0 20px 0;
          font-size: 1.5rem;
        }

        .day-section {
          margin-bottom: 25px;
        }

        .day-section h4 {
          font-family: 'Quicksand', sans-serif;
          font-size: 1.3rem;
          font-weight: 700;
          color: #f4e8d8;
          margin: 0 0 15px 0;
          padding-bottom: 10px;
          border-bottom: 4px solid rgba(125, 211, 192, 0.3);
        }

        .calendar-item {
          background: rgba(30, 30, 46, 0.6);
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 10px;
          border: 2px solid rgba(100, 116, 139, 0.2);
          transition: all 0.3s ease;
        }

        .calendar-item:hover {
          border-color: rgba(125, 211, 192, 0.4);
          background: rgba(30, 30, 46, 0.8);
        }

        .calendar-item.expanded {
          border-color: rgba(125, 211, 192, 0.6);
          background: rgba(30, 30, 46, 0.9);
        }

        .calendar-task-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(100, 116, 139, 0.3);
        }

        .calendar-note-details, .calendar-project-details {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(100, 116, 139, 0.3);
        }

        .note-meta-info, .project-task-summary {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          align-items: center;
        }

        .go-to-btn {
          margin-top: 15px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-family: 'Quicksand', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(45, 106, 79, 0.3);
          width: 100%;
        }

        .go-to-btn:hover {
          background: linear-gradient(135deg, #40916C, #52b788);
          box-shadow: 0 6px 20px rgba(45, 106, 79, 0.5);
          transform: translateY(-2px);
        }

        .calendar-item.expanded {
          background: rgba(30, 30, 46, 0.8);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
        }

        .task-detail-section {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
          align-items: flex-start;
        }

        .task-details-text {
          color: #f4e8d8;
          font-size: 0.95rem;
          line-height: 1.6;
          flex: 1;
        }

        .task-details-text ul, .task-details-text ol {
          margin-left: 20px;
        }

        .task-item {
          border-left: 4px solid #ff6b6b;
        }

        .note-item {
          border-left: 4px solid #7dd3c0;
        }

        .project-item {
          border-left: 4px solid #9333EA;
        }

        .project-date-badge {
          padding: 4px 10px;
          background: rgba(147, 51, 234, 0.2);
          border: 1px solid rgba(147, 51, 234, 0.4);
          border-radius: 12px;
          color: #a855f7;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .project-description-preview {
          color: #b8a99a;
          font-size: 0.85rem;
          margin-top: 6px;
          font-style: italic;
        }

        .project-dates-display {
          display: flex;
          gap: 15px;
          margin-top: 8px;
          flex-wrap: wrap;
        }

        .project-date-info {
          color: #7dd3c0;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .item-header {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
        }

        .list-badge {
          padding: 3px 10px;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .list-badge.personal {
          background: linear-gradient(135deg, #7fb069, #6a9d5f);
          color: #fff;
        }

        .list-badge.work {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
          color: #1a1a2e;
        }

        .list-badge.home {
          background: linear-gradient(135deg, #5a8c4a, #4a7a3a);
          color: #fff;
        }

        .list-badge.travel {
          background: linear-gradient(135deg, #c19bf5, #a78bfa);
          color: #fff;
        }

        .list-badge.kids {
          background: linear-gradient(135deg, #f472b6, #ec4899);
          color: #fff;
        }

        .priority-badge {
          font-size: 1rem;
        }

        .project-badge {
          padding: 4px 10px;
          background: rgba(125, 211, 192, 0.2);
          border: 1px solid rgba(125, 211, 192, 0.4);
          border-radius: 12px;
          color: #7dd3c0;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .item-text {
          color: #f4e8d8;
          font-size: 1rem;
          line-height: 1.5;
        }

        .task-dot {
          color: #2D6A4F;
          font-size: 0.8rem;
          margin-right: 6px;
        }

        .completed-badge {
          display: inline-block;
          margin-top: 8px;
          padding: 3px 10px;
          background: rgba(125, 211, 192, 0.2);
          border-radius: 10px;
          color: #7dd3c0;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .archived-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 12px;
          background: rgba(147, 116, 99, 0.3);
          border: 1px solid rgba(147, 116, 99, 0.5);
          border-radius: 12px;
          color: #d4a574;
          font-size: 0.75rem;
          font-weight: 600;
          z-index: 10;
        }

        .item-preview {
          color: #f4e8d8;
          font-size: 0.95rem;
          line-height: 1.6;
        }

        .item-tags {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
        }

        .mini-tag {
          padding: 3px 8px;
          background: linear-gradient(135deg, #2D6A4F, #40916C);
          border-radius: 10px;
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .note-content ul, .note-content ol {
          padding-left: 30px;
          margin: 8px 0;
        }

        .note-content ul li, .note-content ol li {
          color: #f4e8d8;
          margin: 4px 0;
        }

        .note-content ul li::marker {
          color: #7dd3c0;
          font-weight: bold;
        }

        .note-content ol li::marker {
          color: #7dd3c0;
          font-weight: bold;
        }

        .note-content .checkbox-line {
          display: flex;
          align-items: flex-start;
          margin: 5px 0;
          gap: 8px;
          clear: both;
          width: 100%;
        }

        .note-content .task-checkbox {
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(125, 211, 192, 0.3);
          border-radius: 8px;
          cursor: pointer;
          position: relative;
          transition: all 0.3s ease;
          background: rgba(42, 42, 62, 0.8);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .note-content .task-checkbox:hover {
          border-color: rgba(125, 211, 192, 0.5);
          transform: scale(1.1);
        }

        .note-content .task-checkbox:checked {
          background: linear-gradient(135deg, #7dd3c0, #a8e6cf);
          border-color: #a8e6cf;
        }

        .note-content .task-checkbox:checked::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #1a1a2e;
          font-weight: bold;
          font-size: 12px;
        }

        @media (max-width: 600px) {
          h1 {
            font-size: 2.5rem;
          }

          .project-dates-section {
            flex-direction: column;
          }

          .project-date-field {
            min-width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="container">
        {/* Hamburger Menu */}
        <div className="hamburger-menu">
          <div className="hamburger-icon" onClick={() => setMenuOpen(!menuOpen)}>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
            <div className="hamburger-line"></div>
          </div>
          {menuOpen && (
            <div className="menu-dropdown">
              <div 
                className={`menu-item ${appMode === 'tasks' ? 'active' : ''}`}
                onClick={() => { setAppMode('tasks'); setMenuOpen(false); }}
              >
                Tasks
              </div>
              <div 
                className={`menu-item ${appMode === 'time' ? 'active' : ''}`}
                onClick={() => { setAppMode('time'); setMenuOpen(false); }}
              >
                Time
              </div>
              <div className="menu-divider"></div>
              <div 
                className={`menu-item ${appMode === 'goals' ? 'active' : ''}`}
                onClick={() => { setAppMode('goals'); setMenuOpen(false); }}
              >
                Goals
              </div>
              <div 
                className={`menu-item ${appMode === 'projects' ? 'active' : ''}`}
                onClick={() => { setAppMode('projects'); setMenuOpen(false); }}
              >
                Projects
              </div>
              <div 
                className={`menu-item ${appMode === 'notes' ? 'active' : ''}`}
                onClick={() => { setAppMode('notes'); setMenuOpen(false); }}
              >
                Journal
              </div>
              <div 
                className={`menu-item ${appMode === 'calendar' ? 'active' : ''}`}
                onClick={() => { setAppMode('calendar'); setMenuOpen(false); }}
              >
                Calendar
              </div>
              <div className="menu-divider"></div>
              <div 
                className={`menu-item ${appMode === 'archive' ? 'active' : ''}`}
                onClick={() => { setAppMode('archive'); setMenuOpen(false); }}
              >
                Archive
              </div>
            </div>
          )}
        </div>

        <header>
          <h1>Little Fires</h1>
          <div className="subtitle">
            <div style={{
              width: '80px',
              height: '80px',
              position: 'relative',
              display: 'inline-block'
            }}>
              {/* Circular Progress Ring */}
              <svg 
                style={{
                  position: 'absolute',
                  top: '-6px',
                  left: '-6px',
                  width: '92px',
                  height: '92px',
                  transform: 'rotate(-90deg)',
                  pointerEvents: 'none'
                }}
              >
                <circle
                  cx="46"
                  cy="46"
                  r="40"
                  fill="none"
                  stroke="rgba(58, 58, 74, 0.3)"
                  strokeWidth="4"
                />
              </svg>
              
              {/* Fire Icon */}
              <div style={{
                width: '100%',
                height: '100%',
                filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
              }}>
                <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1280.000000 1280.000000"
                  preserveAspectRatio="xMidYMid meet"
                  style={{width: '100%', height: '100%'}}>
                  <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                    fill="#000000" stroke="none">
                  <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                  -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                  -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                  17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                  -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                  132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                  680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                  -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                  -1 -56z"/>
                  <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                  -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                  -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                  -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                  289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                  553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                  -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                  <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                  -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                  -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                  -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                  36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                  -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                  95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                </g>
              </svg>
              </div>
            </div>
          </div>
        </header>

        {appMode === 'tasks' && (
          <>
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentList === 'master' ? 'active' : ''}`}
                onClick={() => setCurrentList('master')}
              >
                All Tasks
              </button>
              <div className="tabs">
                <button
                  className={`tab ${currentList === 'personal' ? 'active' : ''}`}
                  onClick={() => setCurrentList('personal')}
                >
                  Personal
                </button>
                <button
                  className={`tab ${currentList === 'work' ? 'active' : ''}`}
                  onClick={() => setCurrentList('work')}
                >
                  Work
                </button>
                <button
                  className={`tab ${currentList === 'home' ? 'active' : ''}`}
                  onClick={() => setCurrentList('home')}
                >
                  Home
                </button>
                <button
                  className={`tab ${currentList === 'travel' ? 'active' : ''}`}
                  onClick={() => setCurrentList('travel')}
                >
                  Travel
                </button>
                <button
                  className={`tab ${currentList === 'kids' ? 'active' : ''}`}
                  onClick={() => setCurrentList('kids')}
                >
                  Kids
                </button>
              </div>
            </div>

            <div className={`search-filter-bar ${currentList !== 'master' ? 'hidden' : ''}`}>
              <input
                type="text"
                className="search-box"
                placeholder="🔍 Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={`input-container ${currentList === 'master' ? 'hidden' : ''}`}>
              <div className="task-input-wrapper">
                <input
                  type="text"
                  placeholder="Task"
                  value={taskInput}
                  onChange={(e) => setTaskInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTask()}
                />
                <button className="add-task-btn" onClick={addTask}>Add Task</button>
              </div>
              <div className="task-options">
                {currentList === 'kids' && (
                  <div className="child-selector">
                    <button
                      className={`child-btn ${selectedChild === 'Stella' ? 'active' : ''}`}
                      onClick={() => setSelectedChild(selectedChild === 'Stella' ? null : 'Stella')}
                    >
                      Stella
                    </button>
                    <button
                      className={`child-btn ${selectedChild === 'Liam' ? 'active' : ''}`}
                      onClick={() => setSelectedChild(selectedChild === 'Liam' ? null : 'Liam')}
                    >
                      Liam
                    </button>
                  </div>
                )}
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  title="Due Date"
                />
                <div className="fire-flag-selector">
                  <span 
                    className={`fire-flag-icon clickable ${selectedPriority === 'high' ? 'active' : ''}`}
                    onClick={() => setSelectedPriority(selectedPriority === 'high' ? 'low' : 'high')}
                    title="Pin to top"
                  >
                    {selectedPriority === 'high' ? <LitFlame /> : <UnlitFlame />}
                  </span>
                </div>
              </div>
            </div>

            <div className="tasks-container">
              {renderTasks()}
            </div>
          </>
        )}

        {appMode === 'notes' && (
          <div 
            className="notes-section"
            onClick={(e) => {
              // Collapse expanded notes when clicking outside note entries
              const clickedNoteEntry = e.target.closest('.note-entry');
              if (!clickedNoteEntry) {
                // Check if we clicked on certain interactive elements that should NOT collapse
                const clickedButton = e.target.closest('button');
                const clickedInput = e.target.closest('input');
                const clickedSelect = e.target.closest('select');
                
                if (!clickedButton && !clickedInput && !clickedSelect) {
                  setNotes(notes.map(note => ({ ...note, expanded: false })));
                }
              }
            }}
          >
            <div className="notes-header" style={{display: 'block', textAlign: 'center'}}>
              <button className="add-task-btn" onClick={addNote} style={{width: '70%', display: 'inline-block'}}>New Journal Entry</button>
            </div>

            {/* Search bar */}
            <div className="search-filter-bar">
              <input
                type="text"
                className="search-box"
                placeholder="🔍 Search notes..."
                value={noteSearchQuery}
                onChange={(e) => setNoteSearchQuery(e.target.value)}
              />
            </div>

            {/* Tag filter */}
            {getAllTags().length > 0 && (
              <div className="tag-filter-bar">
                <span style={{color: '#999', fontSize: '0.9rem', marginRight: '10px'}}>Filter by tag:</span>
                <button 
                  className={`tag-pill ${selectedTag === null ? 'active' : ''}`}
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </button>
                {getAllTags().map(tag => (
                  <button
                    key={tag}
                    className={`tag-pill ${selectedTag === tag ? 'active' : ''}`}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            <div className="notes-list">
              {filterNotes().length === 0 ? (
                <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    position: 'relative',
                    display: 'inline-block'
                  }}>
                    {/* Background circle */}
                    <svg 
                      style={{
                        position: 'absolute',
                        top: '-15px',
                        left: '-15px',
                        width: '210px',
                        height: '210px',
                        transform: 'rotate(-90deg)',
                        pointerEvents: 'none'
                      }}
                    >
                      <circle
                        cx="105"
                        cy="105"
                        r="95"
                        fill="none"
                        stroke="rgba(58, 58, 74, 0.3)"
                        strokeWidth="8"
                      />
                    </svg>
                    
                    {/* Dark Fire Icon */}
                    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 1280.000000 1280.000000"
                      preserveAspectRatio="xMidYMid meet"
                      style={{
                        width: '100%',
                        height: '100%',
                        filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                      }}>
                      <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                        fill="#3a3a4a" stroke="none">
                        <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                        -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                        -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                        17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                        -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                        132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                        680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                        -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                        -1 -56z"/>
                        <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                        -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                        -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                        -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                        289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                        553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                        -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                        <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                        -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                        -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                        -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                        36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                        -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                        95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                      </g>
                    </svg>
                  </div>
                </div>
              ) : (
                filterNotes().map(note => (
                  <div 
                    key={note.id} 
                    className="note-entry" 
                    data-note-id={note.id}
                    onClick={(e) => {
                      // If clicking directly on note-entry (padding area), collapse
                      if (e.target.classList.contains('note-entry') && e.target === e.currentTarget) {
                        setNotes(notes.map(n => ({ ...n, expanded: false })));
                      } else {
                        // Clicking on content - stop propagation to keep note open
                        e.stopPropagation();
                      }
                    }}
                  >
                    <div className="note-header" onClick={() => toggleNoteExpanded(note.id)}>
                      <span className="note-date">
                        {new Date(note.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="note-toggle">{note.expanded ? '▼' : '▶'}</span>
                    </div>
                    {note.expanded && (
                      <>
                        {/* Note Section */}
                        <div style={{
                          marginBottom: '20px',
                          padding: '20px',
                          background: 'rgba(42, 42, 62, 0.8)',
                          borderRadius: '15px',
                          border: '2px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          <div style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#f4e8d8',
                            marginBottom: '15px',
                            marginTop: 0,
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                          }}>
                            Note
                          </div>

                        <div className="richtext-toolbar" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              const selection = window.getSelection();
                              if (!selection.rangeCount || !noteContent.contains(selection.anchorNode)) {
                                const range = document.createRange();
                                range.selectNodeContents(noteContent);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              } else {
                                const range = selection.getRangeAt(0);
                                
                                const checkboxLine = document.createElement('div');
                                checkboxLine.className = 'checkbox-line';
                                checkboxLine.style.display = 'block';
                                
                                const checkbox = document.createElement('input');
                                checkbox.type = 'checkbox';
                                checkbox.className = 'task-checkbox';
                                checkbox.onclick = (evt) => evt.stopPropagation();
                                
                                const textSpan = document.createElement('span');
                                textSpan.innerHTML = '&nbsp;';
                                textSpan.contentEditable = 'true';
                                
                                checkboxLine.appendChild(checkbox);
                                checkboxLine.appendChild(textSpan);
                                
                                const beforeBreak = document.createElement('br');
                                range.insertNode(beforeBreak);
                                range.collapse(false);
                                
                                range.insertNode(checkboxLine);
                                
                                const afterBreak = document.createElement('br');
                                range.collapse(false);
                                range.insertNode(afterBreak);
                                
                                const newRange = document.createRange();
                                newRange.setStart(textSpan, 0);
                                newRange.collapse(true);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                              }
                            }}
                            title="Insert Checkbox"
                          >
                            ☑ Box
                          </button>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              const selection = window.getSelection();
                              if (!selection.rangeCount || !noteContent.contains(selection.anchorNode)) {
                                const range = document.createRange();
                                range.selectNodeContents(noteContent);
                                range.collapse(false);
                                selection.removeAllRanges();
                                selection.addRange(range);
                              }
                              
                              document.execCommand('insertUnorderedList', false, null);
                            }}
                            title="Bullet List"
                          >
                            • Bullets
                          </button>
                          <button 
                            className="toolbar-btn"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              noteContent.focus();
                              
                              document.execCommand('bold', false, null);
                            }}
                            title="Bold"
                          >
                            <strong style={{fontWeight: 900}}>B</strong>
                          </button>
                          <button 
                            className="toolbar-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (evt) => {
                                const file = evt.target.files[0];
                                if (file) {
                                  addImageToNote(note.id, file);
                                }
                              };
                              input.click();
                            }}
                            title="Upload Image"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                          </button>
                        </div>

                        {/* Display uploaded images */}
                        {note.images && note.images.length > 0 && (
                          <div className="note-images">
                            {note.images.map(img => (
                              <div key={img.id} className="note-image-container">
                                <img src={img.data} alt="Note attachment" className="note-image" />
                                <button 
                                  className="remove-image-btn"
                                  onClick={() => removeImageFromNote(note.id, img.id)}
                                >
                                  ×
                                </button>
                                {img.isProcessing && (
                                  <div className="ocr-status">Extracting text...</div>
                                )}
                                {!img.isProcessing && img.extractedText && (
                                  <div className="extracted-text">
                                    <div className="extracted-text-label">Extracted Text:</div>
                                    <div className="extracted-text-content">
                                      {img.extractedText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div 
                          className="note-content"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => updateNote(note.id, e.currentTarget.innerHTML)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            
                            if (e.key === 'Enter') {
                              const selection = window.getSelection();
                              if (selection.rangeCount > 0) {
                                const range = selection.getRangeAt(0);
                                const currentNode = range.startContainer;
                                
                                let checkboxLine = currentNode.nodeType === Node.ELEMENT_NODE ? 
                                  currentNode.closest('.checkbox-line') : 
                                  currentNode.parentElement?.closest('.checkbox-line');
                                
                                if (checkboxLine) {
                                  e.preventDefault();
                                  
                                  const newCheckboxLine = document.createElement('div');
                                  newCheckboxLine.className = 'checkbox-line';
                                  newCheckboxLine.style.display = 'block';
                                  
                                  const newCheckbox = document.createElement('input');
                                  newCheckbox.type = 'checkbox';
                                  newCheckbox.className = 'task-checkbox';
                                  newCheckbox.onclick = (evt) => evt.stopPropagation();
                                  
                                  const newTextSpan = document.createElement('span');
                                  newTextSpan.innerHTML = '&nbsp;';
                                  newTextSpan.contentEditable = 'true';
                                  
                                  newCheckboxLine.appendChild(newCheckbox);
                                  newCheckboxLine.appendChild(newTextSpan);
                                  
                                  checkboxLine.parentNode.insertBefore(newCheckboxLine, checkboxLine.nextSibling);
                                  
                                  const newRange = document.createRange();
                                  newRange.setStart(newTextSpan, 0);
                                  newRange.collapse(true);
                                  selection.removeAllRanges();
                                  selection.addRange(newRange);
                                }
                              }
                            }
                          }}
                          dangerouslySetInnerHTML={{ __html: note.content || '' }}
                        />

                        {/* Photo Gallery Section */}
                        <div style={{marginTop: '20px'}}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <label style={{
                              color: '#b8a99a',
                              fontSize: '0.9rem',
                              fontFamily: 'Quicksand, sans-serif',
                              fontWeight: '600'
                            }}>
                              Photos:
                            </label>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addGalleryPhotoToNote(note.id, file);
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {/* Display gallery photos */}
                          {note.gallery && note.gallery.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px',
                              marginTop: '10px'
                            }}>
                              {note.gallery.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(125, 211, 192, 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="Gallery" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    onClick={() => removeGalleryPhotoFromNote(note.id, photo.id)}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Location Field */}
                        <div style={{marginTop: '15px'}}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}>
                            <label style={{
                              color: '#b8a99a',
                              fontSize: '0.9rem',
                              fontFamily: 'Quicksand, sans-serif',
                              fontWeight: '600',
                              minWidth: 'fit-content'
                            }}>
                              Location:
                            </label>
                            <input
                              type="text"
                              value={note.location || ''}
                              onChange={(e) => updateNoteLocation(note.id, e.target.value)}
                              onFocus={() => {
                                // Auto-fetch location if empty
                                if (!note.location || note.location === '') {
                                  fetchLocationForNote(note.id);
                                }
                              }}
                              placeholder="Click to auto-detect or type location..."
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                background: 'rgba(42, 42, 62, 0.8)',
                                border: '2px solid rgba(125, 211, 192, 0.3)',
                                borderRadius: '8px',
                                color: '#f4e8d8',
                                fontSize: '0.9rem',
                                fontFamily: 'Quicksand, sans-serif'
                              }}
                            />
                            {note.location && (
                              <button
                                onClick={() => updateNoteLocation(note.id, '')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#b8a99a',
                                  cursor: 'pointer',
                                  fontSize: '1.2rem',
                                  padding: '4px 8px'
                                }}
                                title="Clear location"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Tags section */}
                        <div style={{marginTop: '15px'}}>
                          <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px'}}>
                            {(note.tags || []).map(tag => (
                              <span key={tag} className="note-tag">
                                {tag}
                                <button 
                                  className="tag-remove"
                                  onClick={() => removeTagFromNote(note.id, tag)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          
                          <input
                            type="text"
                            placeholder="Tags"
                            className="tag-input"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                addTagToNote(note.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        </div>

                        {/* Time Logged Section */}
                        <div style={{
                          marginTop: '20px',
                          padding: '20px',
                          background: 'rgba(42, 42, 62, 0.8)',
                          borderRadius: '15px',
                          border: '2px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          <div style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#f4e8d8',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                          }}>
                            Time Logged
                          </div>
                          {(note.timeLogged || 0) > 0 && (
                            <div style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '2rem',
                              fontWeight: '700',
                              color: '#f4e8d8',
                              marginBottom: '15px',
                              textAlign: 'center'
                            }}>
                              {(() => {
                                const hours = Math.floor((note.timeLogged || 0) / 60);
                                const minutes = (note.timeLogged || 0) % 60;
                                if (hours > 0) {
                                  return `${hours}h ${minutes}m`;
                                } else {
                                  return `${minutes}m`;
                                }
                              })()}
                            </div>
                          )}
                          <div style={{textAlign: 'center'}}>
                            <button 
                              className="add-task-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTimeLoggerContext({ type: 'note', id: note.id });
                                setShowTimeLogger(true);
                                setLoggedMinutes(0);
                                setIsLogging(false);
                                setLogStartTime(null);
                              }}
                              style={{width: 'auto', padding: '12px 30px'}}
                            >
                              Log Time
                            </button>
                          </div>
                        </div>

                        <div style={{display: 'flex', gap: '15px', marginTop: '10px', justifyContent: 'flex-end'}}>
                          <button 
                            className="edit-btn"
                            onClick={(e) => {
                              const noteContent = e.target.closest('.note-entry').querySelector('.note-content');
                              updateNote(note.id, noteContent.innerHTML);
                              // Collapse the note after saving
                              setNotes(prev => prev.map(n => 
                                n.id === note.id ? { ...n, expanded: false } : n
                              ));
                            }}
                          >
                            Save
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => setNoteToDelete(note.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Delete Confirmation Modal */}
            {noteToDelete && (
              <div className="modal-overlay" onClick={() => setNoteToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Note?</h3>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteNote(noteToDelete);
                        setNoteToDelete(null);
                      }}
                    >
                      Confirm Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setNoteToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'projects' && (
          <div className="projects-section">
            {/* Project Tabs - Always visible */}
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentProjectList === 'master' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentProjectList('master');
                  setSelectedProject(null);
                }}
              >
                All Projects
              </button>
              <div className="tabs">
                <button
                  className={`tab ${currentProjectList === 'personal' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('personal');
                    setSelectedProject(null);
                  }}
                >
                  Personal
                </button>
                <button
                  className={`tab ${currentProjectList === 'work' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('work');
                    setSelectedProject(null);
                  }}
                >
                  Work
                </button>
                <button
                  className={`tab ${currentProjectList === 'home' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('home');
                    setSelectedProject(null);
                  }}
                >
                  Home
                </button>
                <button
                  className={`tab ${currentProjectList === 'travel' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('travel');
                    setSelectedProject(null);
                  }}
                >
                  Travel
                </button>
                <button
                  className={`tab ${currentProjectList === 'kids' ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentProjectList('kids');
                    setSelectedProject(null);
                  }}
                >
                  Kids
                </button>
              </div>
            </div>

            {!selectedProject ? (
              <>
                {currentProjectList !== 'master' && (
                  <div className="projects-header" style={{display: 'block', textAlign: 'center'}}>
                    <button 
                      className="add-task-btn" 
                      onClick={() => setShowProjectForm(true)}
                      style={{width: '70%', display: 'inline-block'}}
                    >
                      New Project
                    </button>
                  </div>
                )}

                {/* Project Form Modal */}
                {showProjectForm && (
                  <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                      <h3>{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
                      <div className="form-field">
                        <label>Project Name *</label>
                        <input
                          type="text"
                          value={projectFormData.name}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter project name"
                          autoFocus
                        />
                      </div>
                      <div className="form-field">
                        <label>Description</label>
                        <textarea
                          value={projectFormData.description}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter project description (optional)"
                          rows="3"
                        />
                      </div>
                      <div className="form-field">
                        <label>Start Date</label>
                        <input
                          type="date"
                          value={projectFormData.startDate}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                      </div>
                      <div className="form-field">
                        <label>End Date</label>
                        <input
                          type="date"
                          value={projectFormData.endDate}
                          onChange={(e) => setProjectFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                      </div>
                      <div className="modal-actions">
                        <button className="edit-btn" onClick={submitProjectForm}>
                          {editingProject ? 'Save Changes' : 'Create Project'}
                        </button>
                        <button className="delete-btn" onClick={() => {
                          setShowProjectForm(false);
                          setEditingProject(null);
                          setProjectFormData({ name: '', description: '', startDate: '', endDate: '' });
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Projects List */}
                <div className="projects-list">
                  {getCurrentProjects().length === 0 ? (
                    <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        {/* Background circle */}
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '-15px',
                            width: '210px',
                            height: '210px',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                        >
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="rgba(58, 58, 74, 0.3)"
                            strokeWidth="8"
                          />
                        </svg>
                        
                        {/* Dark Fire Icon */}
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  ) : currentProjectList === 'master' ? (
                    // Master view - group by list
                    ['personal', 'work', 'home', 'travel', 'kids'].map(listName => {
                      const listProjects = projects[listName] || [];
                      if (listProjects.length === 0) return null;
                      
                      return (
                        <div key={listName} className="list-section">
                          <div className="list-section-header">
                            <span style={{textTransform: 'capitalize'}}>{listName} Projects</span>
                            <span className={`badge ${listName}`}>{listProjects.length}</span>
                          </div>
                          {listProjects.map(project => {
                            const projectTasks = getProjectTasks(project.id);
                            const completedTasks = projectTasks.filter(t => t.completed).length;
                            const totalTasks = projectTasks.length;
                            
                            return (
                              <div key={project.id} className="project-card">
                                <div className="project-header" onClick={() => setSelectedProject({ id: project.id, listName })}>
                                  <div>
                                    <h3>{project.name}</h3>
                                    {project.description && (
                                      <p className="project-description">{project.description}</p>
                                    )}
                                  </div>
                                  <div className="project-meta">
                                    {(project.startDate || project.endDate) && (
                                      <span className="project-due-date">
                                        📅 {project.startDate && parseLocalDate(project.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {project.startDate && project.endDate && ' - '}
                                        {project.endDate && parseLocalDate(project.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                    <span className="project-task-count">
                                      {completedTasks}/{totalTasks} tasks
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    // Individual list view
                    getCurrentProjects().map(project => {
                      const projectTasks = getProjectTasks(project.id);
                      const completedTasks = projectTasks.filter(t => t.completed).length;
                      const totalTasks = projectTasks.length;
                      
                      return (
                        <div key={project.id} className="project-card">
                          <div className="project-header" onClick={() => setSelectedProject({ id: project.id, listName: currentProjectList })}>
                            <div>
                              <h3>{project.name}</h3>
                              {project.description && (
                                <p className="project-description">{project.description}</p>
                              )}
                            </div>
                            <div className="project-meta">
                              {(project.startDate || project.endDate) && (
                                <span className="project-due-date">
                                  📅 {project.startDate && parseLocalDate(project.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {project.startDate && project.endDate && ' - '}
                                  {project.endDate && parseLocalDate(project.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              <span className="project-task-count">
                                {completedTasks}/{totalTasks} tasks
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Project Detail View */}
                {(() => {
                  const project = projects[selectedProject.listName]?.find(p => p.id === selectedProject.id);
                  if (!project) return null;
                  
                  const tasks = getProjectTasks(selectedProject.id);
                  const todoTasks = tasks.filter(t => t.section === 'todo' && !t.completed);
                  const backlogTasks = tasks.filter(t => t.section === 'backlog' && !t.completed);
                  const completedTasks = tasks.filter(t => t.completed);
                  
                  return (
                    <div 
                      className="project-detail"
                      onClick={(e) => {
                        // Close if clicking on the background (not the detail content)
                        if (e.target.className === 'project-detail') {
                          setSelectedProject(null);
                        }
                      }}
                    >
                      <div className="project-detail-content">
                      {/* Project Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Project
                        </div>

                        <div className="project-detail-header">
                          {editingProjectName ? (
                            <input
                              type="text"
                              value={project.name}
                              onChange={(e) => {
                                updateProject(selectedProject.listName, selectedProject.id, { name: e.target.value });
                              }}
                              onBlur={() => setEditingProjectName(false)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') setEditingProjectName(false);
                              }}
                              autoFocus
                              className="project-name-edit"
                            />
                          ) : (
                            <h2 onClick={() => setEditingProjectName(true)} style={{cursor: 'pointer'}} className="project-detail-name">
                              {project.name}
                            </h2>
                          )}
                        </div>

                        {/* Description Field */}
                        <div style={{marginTop: '20px', marginBottom: '20px'}}>
                          <label style={{
                            display: 'block',
                            color: '#b8a99a',
                            fontSize: '0.9rem',
                            marginBottom: '8px',
                            fontFamily: 'Quicksand, sans-serif'
                          }}>
                            Description:
                          </label>
                          <textarea
                            value={project.description || ''}
                            onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { description: e.target.value })}
                            placeholder="Add project description..."
                            style={{
                              width: '100%',
                              minHeight: '80px',
                              padding: '12px',
                              background: 'rgba(42, 42, 62, 0.8)',
                              border: '2px solid rgba(125, 211, 192, 0.3)',
                              borderRadius: '10px',
                              color: '#f4e8d8',
                            fontSize: '0.95rem',
                            fontFamily: 'Quicksand, sans-serif',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Outcome Field */}
                      <div style={{marginBottom: '20px'}}>
                        <label style={{
                          display: 'block',
                          color: '#b8a99a',
                          fontSize: '0.9rem',
                          marginBottom: '8px',
                          fontFamily: 'Quicksand, sans-serif'
                        }}>
                          Outcome:
                        </label>
                        <textarea
                          value={project.outcome || ''}
                          onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { outcome: e.target.value })}
                          placeholder="What does success look like for this project?"
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            background: 'rgba(42, 42, 62, 0.8)',
                            border: '2px solid rgba(125, 211, 192, 0.3)',
                            borderRadius: '10px',
                            color: '#f4e8d8',
                            fontSize: '0.95rem',
                            fontFamily: 'Quicksand, sans-serif',
                            resize: 'vertical',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* Project Dates */}
                      <div className="project-dates-section" style={{marginBottom: '20px'}}>
                        <div className="project-date-field">
                          <label className="project-date-label">Start Date:</label>
                          <input
                            type="date"
                            value={project.startDate || ''}
                            onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { startDate: e.target.value })}
                            className="date-picker"
                          />
                        </div>
                        <div className="project-date-field">
                          <label className="project-date-label">End Date:</label>
                          <input
                            type="date"
                            value={project.endDate || ''}
                            onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { endDate: e.target.value })}
                            className="date-picker"
                          />
                        </div>
                      </div>

                      {/* Before Photos */}
                      <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Before Photos
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <button
                            className="toolbar-btn"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = (evt) => {
                                const files = Array.from(evt.target.files);
                                files.forEach(file => {
                                  if (file) {
                                    addPhotoToProject(selectedProject.listName, selectedProject.id, file, 'beforePhotos');
                                  }
                                });
                              };
                              input.click();
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                            Add Photos
                          </button>
                        </div>
                        
                        {project.beforePhotos && project.beforePhotos.length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px'
                          }}>
                            {project.beforePhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '2px solid rgba(125, 211, 192, 0.3)',
                                  aspectRatio: '1',
                                }}
                              >
                                <img 
                                  src={photo.data} 
                                  alt="Before" 
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                                <button 
                                  onClick={() => removePhotoFromProject(selectedProject.listName, selectedProject.id, photo.id, 'beforePhotos')}
                                  style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* After Photos */}
                      <div style={{
                        marginBottom: '20px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          After Photos
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          marginBottom: '10px'
                        }}>
                          <button
                            className="toolbar-btn"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.multiple = true;
                              input.onchange = (evt) => {
                                const files = Array.from(evt.target.files);
                                files.forEach(file => {
                                  if (file) {
                                    addPhotoToProject(selectedProject.listName, selectedProject.id, file, 'afterPhotos');
                                  }
                                });
                              };
                              input.click();
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.85rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                              <circle cx="12" cy="13" r="4"></circle>
                              <line x1="17" y1="3" x2="17" y2="6"></line>
                              <circle cx="17" cy="2" r="1"></circle>
                            </svg>
                            Add Photos
                          </button>
                        </div>
                        
                        {project.afterPhotos && project.afterPhotos.length > 0 && (
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '10px'
                          }}>
                            {project.afterPhotos.map(photo => (
                              <div 
                                key={photo.id} 
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '2px solid rgba(125, 211, 192, 0.3)',
                                  aspectRatio: '1',
                                }}
                              >
                                <img 
                                  src={photo.data} 
                                  alt="After" 
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                  }}
                                />
                                <button 
                                  onClick={() => removePhotoFromProject(selectedProject.listName, selectedProject.id, photo.id, 'afterPhotos')}
                                  style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    background: 'rgba(0, 0, 0, 0.7)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      </div>

                      {/* Goal Assignment */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Goal
                        </div>
                        <div className="project-date-field" style={{width: '100%'}}>
                          <select
                            value={project.goalId || ''}
                            onChange={(e) => updateProject(selectedProject.listName, selectedProject.id, { 
                              goalId: e.target.value ? parseInt(e.target.value) : null 
                            })}
                            style={{
                              padding: '10px',
                              background: 'rgba(42, 42, 62, 0.8)',
                              border: '2px solid rgba(125, 211, 192, 0.3)',
                              borderRadius: '10px',
                              color: '#f4e8d8',
                              fontSize: '0.95rem',
                              cursor: 'pointer',
                              flex: 1,
                              width: '100%'
                            }}
                          >
                            <option value="">No Goal</option>
                            {(goals[selectedProject.listName] || []).map(goal => (
                              <option key={goal.id} value={goal.id}>
                                {goal.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Tasks Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Tasks
                        </div>

                      {/* Add Task to Project */}
                      <div className="project-task-input">
                        <div className="task-input-wrapper" style={{flexDirection: 'column', alignItems: 'stretch'}}>
                          <div style={{display: 'flex', gap: '10px', marginBottom: '15px'}}>
                            <input
                              type="text"
                              placeholder="Task"
                              value={projectTaskInput}
                              onChange={(e) => setProjectTaskInput(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') addTaskToProject(selectedProject.id, projectTaskList);
                              }}
                              style={{flex: 1}}
                            />
                            <button 
                              className="add-task-btn" 
                              onClick={() => addTaskToProject(selectedProject.id, projectTaskList)}
                            >
                              Add Task
                            </button>
                          </div>
                          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <select
                              value={projectTaskList}
                              onChange={(e) => setProjectTaskList(e.target.value)}
                              className="project-selector"
                            >
                              <option value="personal">Personal</option>
                              <option value="work">Work</option>
                              <option value="home">Home</option>
                              <option value="travel">Travel</option>
                              <option value="kids">Kids</option>
                            </select>
                            <input
                              type="date"
                              value={projectTaskDueDate}
                              onChange={(e) => setProjectTaskDueDate(e.target.value)}
                              className="date-picker"
                            />
                            <span 
                              className={`fire-flag-icon clickable ${projectTaskPriority === 'high' ? 'active' : ''}`}
                              onClick={() => setProjectTaskPriority(projectTaskPriority === 'high' ? 'low' : 'high')}
                              title={projectTaskPriority === 'high' ? 'Remove priority' : 'Mark as high priority'}
                            >
                              {projectTaskPriority === 'high' ? <LitFlame /> : <UnlitFlame />}
                            </span>
                          </div>
                        </div>
                        <div className="section-btn-group" style={{marginTop: '15px'}}>
                          <button
                            className={`section-btn ${projectTaskSection === 'todo' ? 'selected' : ''}`}
                            onClick={() => setProjectTaskSection('todo')}
                          >
                            To Do
                          </button>
                          <button
                            className={`section-btn ${projectTaskSection === 'backlog' ? 'selected' : ''}`}
                            onClick={() => setProjectTaskSection('backlog')}
                          >
                            Backlog
                          </button>
                        </div>
                      </div>

                      {/* Task Sections - Only show if tasks exist */}
                      {tasks.length > 0 && (
                        <>
                          {/* To Do Section */}
                          <div className="list-section">
                            <div className="list-section-header">
                              <span className="section-icon campfire-icon"><BurningCampfire /></span>
                              <span>To Do</span>
                              <span className="badge work">{todoTasks.length}</span>
                            </div>
                            {todoTasks.length === 0 ? (
                              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'inline-block'
                                }}>
                                  {/* Background circle */}
                                  <svg 
                                    style={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '-10px',
                                      width: '140px',
                                      height: '140px',
                                      transform: 'rotate(-90deg)',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <circle
                                      cx="70"
                                      cy="70"
                                      r="63"
                                      fill="none"
                                      stroke="rgba(58, 58, 74, 0.3)"
                                      strokeWidth="6"
                                    />
                                  </svg>
                                  
                                  {/* Dark Fire Icon */}
                                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1280.000000 1280.000000"
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                    }}>
                                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                      fill="#000000" stroke="none">
                                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      -1 -56z"/>
                      <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                      -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                      -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                      -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                      289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                      553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                      -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                      <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                      -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                      -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                      -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                      36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                      -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                      95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                    </g>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              todoTasks.map((task) => (
                                <Task
                                  key={task.id}
                                  task={task}
                                  listName={task.listName}
                                  index={task.index}
                                  showMoveButtons={true}
                                />
                              ))
                            )}
                          </div>

                          {/* Backlog Section */}
                          <div className="list-section">
                            <div className="list-section-header">
                              <span className="section-icon logs-icon"><CutLog /></span>
                              <span>Backlog</span>
                              <span className="badge personal">{backlogTasks.length}</span>
                            </div>
                            {backlogTasks.length === 0 ? (
                              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'inline-block'
                                }}>
                                  {/* Background circle */}
                                  <svg 
                                    style={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '-10px',
                                      width: '140px',
                                      height: '140px',
                                      transform: 'rotate(-90deg)',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <circle
                                      cx="70"
                                      cy="70"
                                      r="63"
                                      fill="none"
                                      stroke="rgba(58, 58, 74, 0.3)"
                                      strokeWidth="6"
                                    />
                                  </svg>
                                  
                                  {/* Dark Fire Icon */}
                                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1280.000000 1280.000000"
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                    }}>
                                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                      fill="#3a3a4a" stroke="none">
                                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                      -1 -56z"/>
                    </g>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              backlogTasks.map((task) => (
                                <Task
                                  key={task.id}
                                  task={task}
                                  listName={task.listName}
                                  index={task.index}
                                  showMoveButtons={true}
                                />
                              ))
                            )}
                          </div>

                          {/* Complete Section */}
                          <div className="list-section">
                            <div className="list-section-header">
                              <span className="section-icon checkbox-icon"><CheckedBox /></span>
                              <span>Complete</span>
                              <span className="badge home">{completedTasks.length}</span>
                            </div>
                            {completedTasks.length === 0 ? (
                              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px'}}>
                                <div style={{
                                  width: '120px',
                                  height: '120px',
                                  position: 'relative',
                                  display: 'inline-block'
                                }}>
                                  {/* Background circle */}
                                  <svg 
                                    style={{
                                      position: 'absolute',
                                      top: '-10px',
                                      left: '-10px',
                                      width: '140px',
                                      height: '140px',
                                      transform: 'rotate(-90deg)',
                                      pointerEvents: 'none'
                                    }}
                                  >
                                    <circle
                                      cx="70"
                                      cy="70"
                                      r="63"
                                      fill="none"
                                      stroke="rgba(58, 58, 74, 0.3)"
                                      strokeWidth="6"
                                    />
                                  </svg>
                                  
                                  {/* Dark Fire Icon */}
                                  <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 1280.000000 1280.000000"
                                    preserveAspectRatio="xMidYMid meet"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                                    }}>
                                    <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                                      fill="#3a3a4a" stroke="none">
                                      <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                                      -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                                      -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                                      17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                                      -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                                      132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                                      680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                                      -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                                      0 -151z"/>
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              completedTasks.map((task) => (
                                <Task
                                  key={task.id}
                                  task={task}
                                  listName={task.listName}
                                  index={task.index}
                                  showMoveButtons={true}
                                />
                              ))
                            )}
                          </div>
                        </>
                      )}
                      </div>

                      {/* Project Actions */}
                      <div className="project-actions">
                        <button 
                          className="delete-project-btn"
                          onClick={() => {
                            setProjectToDelete({
                              id: selectedProject.id,
                              listName: selectedProject.listName,
                              name: project.name
                            });
                          }}
                        >
                          Delete
                        </button>
                      </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Project Delete Confirmation Modal */}
            {projectToDelete && (
              <div className="modal-overlay" onClick={() => setProjectToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Project?</h3>
                  <p style={{color: '#b8a99a', marginBottom: '20px', textAlign: 'center'}}>
                    "{projectToDelete.name}"
                  </p>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteProject(projectToDelete.listName, projectToDelete.id);
                        setProjectToDelete(null);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setProjectToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'calendar' && (
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="month-nav-btn" onClick={() => navigateMonth(-1)}>←</button>
              <h2>
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <button className="month-nav-btn" onClick={() => navigateMonth(1)}>→</button>
            </div>

            <div className="calendar-controls">
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                />
                <span>Projects</span>
              </label>
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showNotes}
                  onChange={(e) => setShowNotes(e.target.checked)}
                />
                <span>Journal</span>
              </label>
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showOpenTasks}
                  onChange={(e) => setShowOpenTasks(e.target.checked)}
                />
                <span>Tasks</span>
              </label>
              <label className="calendar-checkbox">
                <input
                  type="checkbox"
                  checked={showCompletedTasks}
                  onChange={(e) => setShowCompletedTasks(e.target.checked)}
                />
                <span>Completed Tasks</span>
              </label>
            </div>

            <div className="calendar-container">
              {/* Project timelines overlay */}
              {showProjects && (
                <div className="project-timelines">
                  {getActiveProjectsForMonth(currentMonth, currentYear).map((project, idx) => {
                    const firstDayOffset = getFirstDayOfMonth(currentMonth, currentYear);
                    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
                    const monthStart = new Date(currentYear, currentMonth, 1);
                    const monthEnd = new Date(currentYear, currentMonth, daysInMonth);
                    
                    // Calculate start position
                    let startDay = 1;
                    if (project.startDate > monthStart) {
                      startDay = project.startDate.getDate();
                    }
                    
                    // Calculate end position
                    let endDay = daysInMonth;
                    if (project.endDate < monthEnd) {
                      endDay = project.endDate.getDate();
                    }
                    
                    // Calculate grid position
                    const startCol = (startDay - 1 + firstDayOffset) % 7 + 1;
                    const endCol = (endDay - 1 + firstDayOffset) % 7 + 1;
                    const startRow = Math.floor((startDay - 1 + firstDayOffset) / 7) + 2; // +2 for header row
                    const endRow = Math.floor((endDay - 1 + firstDayOffset) / 7) + 2;
                    
                    const colors = {
                      personal: '#6a9d5f',
                      work: '#7dd3c0',
                      home: '#4a7a3a',
                      travel: '#a8e6cf',
                      kids: '#f472b6'
                    };
                    
                    // If project spans multiple weeks, create multiple segments
                    const segments = [];
                    for (let row = startRow; row <= endRow; row++) {
                      const segmentStartCol = row === startRow ? startCol : 1;
                      const segmentEndCol = row === endRow ? endCol : 7;
                      const span = segmentEndCol - segmentStartCol + 1;
                      
                      segments.push({
                        row,
                        startCol: segmentStartCol,
                        span
                      });
                    }
                    
                    return segments.map((segment, segIdx) => (
                      <div
                        key={`${project.id}-${segIdx}`}
                        className="project-timeline-bar"
                        style={{
                          gridRow: segment.row,
                          gridColumn: `${segment.startCol} / span ${segment.span}`,
                          background: `linear-gradient(90deg, ${colors[project.listName]}dd, ${colors[project.listName]}99)`,
                          borderLeft: segment.startCol === startCol && segment.row === startRow ? '3px solid ' + colors[project.listName] : 'none',
                          borderRight: segment.startCol + segment.span - 1 === endCol && segment.row === endRow ? '3px solid ' + colors[project.listName] : 'none'
                        }}
                        title={project.name}
                      >
                        {segment.row === startRow && segment.startCol === startCol && (
                          <span className="project-timeline-label">{project.name}</span>
                        )}
                      </div>
                    ));
                  })}
                </div>
              )}
              
              <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="calendar-day-header">{day}</div>
              ))}
              
              {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, i) => (
                <div key={`empty-${i}`} className="calendar-day empty"></div>
              ))}
              
              {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, i) => {
                const dayNum = i + 1;
                const date = new Date(currentYear, currentMonth, dayNum);
                const items = getItemsForDate(date);
                const isToday = isSameDate(date, new Date());
                const isSelected = selectedDay && isSameDate(date, new Date(currentYear, currentMonth, selectedDay));
                
                return (
                  <div
                    key={dayNum}
                    className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${items.length > 0 ? 'has-items' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === dayNum ? null : dayNum)}
                  >
                    <div className="day-number">{dayNum}</div>
                    {items.length > 0 && (
                      <div className="day-indicators">
                        {items.filter(item => item.type === 'task').length > 0 && (
                          <span className="indicator task-indicator" title={`${items.filter(item => item.type === 'task').length} task(s)`}>
                            ●
                          </span>
                        )}
                        {items.filter(item => item.type === 'note').length > 0 && (
                          <span className="indicator note-indicator" title={`${items.filter(item => item.type === 'note').length} note(s)`}>
                            ●
                          </span>
                        )}
                        {items.filter(item => item.type === 'project').length > 0 && (
                          <span className="indicator project-indicator" title={`${items.filter(item => item.type === 'project').length} project(s)`}>
                            ●
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            {selectedDay && (
              <div className="day-details">
                <h3>
                  {new Date(currentYear, currentMonth, selectedDay).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h3>
                {(() => {
                  const items = getItemsForDate(new Date(currentYear, currentMonth, selectedDay));
                  if (items.length === 0) {
                    return <p style={{color: '#999', textAlign: 'center', padding: '20px'}}>No items for this day</p>;
                  }
                  
                  const tasks = items.filter(item => item.type === 'task');
                  const notes = items.filter(item => item.type === 'note');
                  const projectItems = items.filter(item => item.type === 'project');
                  
                  return (
                    <div className="day-items">
                      {tasks.length > 0 && (
                        <div className="day-section">
                          <h4>Tasks ({tasks.length})</h4>
                          {tasks.map((item, idx) => {
                            const project = item.data.projectId 
                              ? getAllProjects().find(p => p.id == item.data.projectId)
                              : null;
                            
                            const taskId = `calendar-${item.list}-${item.data.id}`;
                            const isExpanded = expandedCalendarTaskId === taskId;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`calendar-item task-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarTaskId(isExpanded ? null : taskId)}
                                style={{cursor: 'pointer'}}
                              >
                                <div className="item-header">
                                  <span className={`list-badge ${item.list}`}>{item.list}</span>
                                  {project && (
                                    <span className="project-badge">
                                      {project.name}
                                    </span>
                                  )}
                                  {item.data.priority === 'high' && <span className="priority-badge">🔥</span>}
                                </div>
                                <div className="item-text">
                                  <span className="task-dot">●</span> {item.data.text}
                                </div>
                                {item.data.completed && <span className="completed-badge">✓ Completed</span>}
                                
                                {isExpanded && (
                                  <div className="calendar-task-details" onClick={(e) => e.stopPropagation()}>
                                    {item.data.details && (
                                      <div className="task-detail-section">
                                        <div className="details-label">Details:</div>
                                        <div className="task-details-text" dangerouslySetInnerHTML={{ __html: item.data.details }} />
                                      </div>
                                    )}
                                    {item.data.dueDate && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Due:</span>
                                        <span className="date-field-value">
                                          {parseLocalDate(item.data.dueDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {item.data.createdAt && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Created:</span>
                                        <span className="date-field-value">
                                          {new Date(item.data.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    {item.data.completedAt && (
                                      <div className="task-detail-section">
                                        <span className="details-label">Completed:</span>
                                        <span className="date-field-value">
                                          {new Date(item.data.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      </div>
                                    )}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const taskIndex = allLists[item.list]?.findIndex(t => t.id === item.data.id);
                                        if (taskIndex !== -1) {
                                          setAppMode('tasks');
                                          setCurrentList(item.list);
                                          setSelectedDate(null);
                                          setTimeout(() => {
                                            setExpandedTaskId(`${item.list}-${taskIndex}`);
                                          }, 100);
                                        }
                                      }}
                                    >
                                      Go to Task →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {notes.length > 0 && (
                        <div className="day-section">
                          <h4>Journal ({notes.length})</h4>
                          {notes.map((item, idx) => {
                            const noteId = `calendar-note-${item.data.id}`;
                            const isExpanded = expandedCalendarNoteId === noteId;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`calendar-item note-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarNoteId(isExpanded ? null : noteId)}
                                style={{cursor: 'pointer'}}
                              >
                                <div 
                                  className="item-preview"
                                  dangerouslySetInnerHTML={{ 
                                    __html: (item.data.content || 'Empty note').substring(0, isExpanded ? undefined : 150) + (isExpanded ? '' : '...')
                                  }}
                                />
                                {item.data.tags && item.data.tags.length > 0 && (
                                  <div className="item-tags">
                                    {item.data.tags.map(tag => (
                                      <span key={tag} className="mini-tag">{tag}</span>
                                    ))}
                                  </div>
                                )}
                                {isExpanded && (
                                  <div className="calendar-note-details" onClick={(e) => e.stopPropagation()}>
                                    <div className="note-meta-info">
                                      <span className="details-label">Written:</span>
                                      <span className="date-field-value">
                                        {new Date(item.data.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </div>
                                    {item.data.images && item.data.images.length > 0 && (
                                      <div className="note-meta-info">
                                        <span className="details-label">📷 {item.data.images.length} image{item.data.images.length > 1 ? 's' : ''}</span>
                                      </div>
                                    )}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAppMode('notes');
                                        setSelectedDate(null);
                                        setTimeout(() => {
                                          const noteElement = document.querySelector(`[data-note-id="${item.data.id}"]`);
                                          if (noteElement) {
                                            noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            // Expand the note
                                            const currentNote = allNotes.find(n => n.id === item.data.id);
                                            if (currentNote && !currentNote.expanded) {
                                              toggleNoteExpanded(item.data.id);
                                            }
                                          }
                                        }, 100);
                                      }}
                                    >
                                      Go to Journal Entry →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {projectItems.length > 0 && (
                        <div className="day-section">
                          <h4>Projects ({projectItems.length})</h4>
                          {projectItems.map((item, idx) => {
                            const projectId = `calendar-project-${item.data.id}`;
                            const isExpanded = expandedCalendarProjectId === projectId;
                            
                            return (
                              <div 
                                key={idx} 
                                className={`calendar-item project-item ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => setExpandedCalendarProjectId(isExpanded ? null : projectId)}
                                style={{cursor: 'pointer'}}
                              >
                                <div className="item-header">
                                  <span className={`list-badge ${item.list}`}>{item.list}</span>
                                  <span className="project-date-badge">
                                    {item.dateType === 'start' && '🚀 Start'}
                                    {item.dateType === 'end' && '🏁 End'}
                                    {item.dateType === 'both' && '🚀 Start & 🏁 End'}
                                  </span>
                                </div>
                                <div className="item-text">
                                  {item.data.name}
                                </div>
                                {item.data.description && (
                                  <div className="project-description-preview">
                                    {item.data.description}
                                  </div>
                                )}
                                {isExpanded && (
                                  <div className="calendar-project-details" onClick={(e) => e.stopPropagation()}>
                                    <div className="project-dates-display">
                                      {item.data.startDate && (
                                        <span className="project-date-info">
                                          Start: {parseLocalDate(item.data.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      )}
                                      {item.data.endDate && (
                                        <span className="project-date-info">
                                          End: {parseLocalDate(item.data.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                      )}
                                    </div>
                                    {(() => {
                                      const projectTasks = getProjectTasks(item.data.id);
                                      const totalTasks = projectTasks.length;
                                      const completedTasks = projectTasks.filter(t => t.completed).length;
                                      
                                      return totalTasks > 0 && (
                                        <div className="project-task-summary">
                                          <span className="details-label">Tasks:</span>
                                          <span className="date-field-value">
                                            {completedTasks}/{totalTasks} completed
                                          </span>
                                        </div>
                                      );
                                    })()}
                                    <button
                                      className="go-to-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAppMode('projects');
                                        setCurrentProjectList(item.list);
                                        setSelectedProject({ id: item.data.id, listName: item.list });
                                        setSelectedDate(null);
                                      }}
                                    >
                                      Go to Project →
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {appMode === 'goals' && (
          <div className="goals-section">
            
            <div className="tabs-container">
              <button
                className={`tab master-tab ${currentGoalList === 'master' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('master');
                  setSelectedGoal(null);
                }}
              >
                All Goals
              </button>
            </div>

            <div className="tabs">
              <button
                className={`tab ${currentGoalList === 'personal' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('personal');
                  setSelectedGoal(null);
                }}
              >
                Personal
              </button>
              <button
                className={`tab ${currentGoalList === 'work' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('work');
                  setSelectedGoal(null);
                }}
              >
                Work
              </button>
              <button
                className={`tab ${currentGoalList === 'home' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('home');
                  setSelectedGoal(null);
                }}
              >
                Home
              </button>
              <button
                className={`tab ${currentGoalList === 'travel' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('travel');
                  setSelectedGoal(null);
                }}
              >
                Travel
              </button>
              <button
                className={`tab ${currentGoalList === 'kids' ? 'active' : ''}`}
                onClick={() => {
                  setCurrentGoalList('kids');
                  setSelectedGoal(null);
                }}
              >
                Kids
              </button>
            </div>

            {currentGoalList !== 'master' && (
              <button 
                className="add-task-btn" 
                style={{marginTop: '20px', marginBottom: '20px', width: '70%', display: 'block', margin: '20px auto'}}
                onClick={() => {
                  setShowGoalForm(true);
                  setEditingGoal(null);
                  setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                }}
              >
                New Goal
              </button>
            )}

            {!selectedGoal ? (
              <>
                {/* Goals List View */}
                <div className="goals-container">
                  {getCurrentGoals().length === 0 ? (
                    <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        {/* Background circle */}
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '-15px',
                            width: '210px',
                            height: '210px',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                        >
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="rgba(58, 58, 74, 0.3)"
                            strokeWidth="8"
                          />
                        </svg>
                        
                        {/* Dark Fire Icon */}
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  ) : currentGoalList === 'master' ? (
                    // Master view - group by list
                    ['personal', 'work', 'home', 'travel', 'kids'].map(listName => {
                      const listGoals = goals[listName] || [];
                      if (listGoals.length === 0) return null;
                      
                      return (
                        <div key={listName} className="list-section">
                          <div className="list-section-header">
                            <span style={{textTransform: 'capitalize'}}>{listName} Goals</span>
                            <span className={`badge ${listName}`}>{listGoals.length}</span>
                          </div>
                          {listGoals.map(goal => {
                            const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                            
                            return (
                              <div key={goal.id} className="goal-card">
                                <div 
                                  className="goal-header"
                                  onClick={() => setSelectedGoal({ id: goal.id, listName })}
                                  style={{cursor: 'pointer'}}
                                >
                                  <div>
                                    <h3 style={{margin: '0 0 8px 0'}}>{goal.name}</h3>
                                    {goal.description && (
                                      <p className="project-description">{goal.description}</p>
                                    )}
                                  </div>
                                  <div className="project-meta">
                                    {(goal.startDate || goal.endDate) && (
                                      <span className="project-due-date">
                                        📅 {goal.startDate && parseLocalDate(goal.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {goal.startDate && goal.endDate && ' - '}
                                        {goal.endDate && parseLocalDate(goal.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    )}
                                    <span className="goal-project-count">
                                      {goalProjects.length} project{goalProjects.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })
                  ) : (
                    // Individual list view
                    getCurrentGoals().map(goal => {
                      const listName = currentGoalList;
                      const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                      
                      return (
                        <div key={goal.id} className="goal-card">
                          <div 
                            className="goal-header"
                            onClick={() => setSelectedGoal({ id: goal.id, listName })}
                            style={{cursor: 'pointer'}}
                          >
                            <div>
                              <h3 style={{margin: '0 0 8px 0'}}>{goal.name}</h3>
                              {goal.description && (
                                <p className="project-description">{goal.description}</p>
                              )}
                            </div>
                            <div className="project-meta">
                              {(goal.startDate || goal.endDate) && (
                                <span className="project-due-date">
                                  📅 {goal.startDate && parseLocalDate(goal.startDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {goal.startDate && goal.endDate && ' - '}
                                  {goal.endDate && parseLocalDate(goal.endDate)?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                              <span className="goal-project-count">
                                {goalProjects.length} project{goalProjects.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Goal Detail View */}
                {(() => {
                  const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                  if (!goal) return null;
                  
                  const goalProjects = Object.values(projects).flat().filter(p => p.goalId == goal.id);
                  
                  return (
                    <div 
                      className="goal-detail"
                      onClick={(e) => {
                        // Close if clicking on the background (not the detail content)
                        if (e.target.className === 'goal-detail') {
                          setSelectedGoal(null);
                        }
                      }}
                    >
                      <div className="goal-detail-content">
                      {/* Goal Section */}
                      <div style={{
                        marginBottom: '30px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Goal
                        </div>

                        <div className="project-detail-header">
                          {editingGoalName ? (
                            <input
                              type="text"
                              value={goal.name}
                              onChange={(e) => {
                                updateGoal(selectedGoal.listName, selectedGoal.id, { name: e.target.value });
                              }}
                              onBlur={() => setEditingGoalName(false)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') setEditingGoalName(false);
                              }}
                              autoFocus
                              className="project-name-edit"
                            />
                          ) : (
                            <h2 onClick={() => setEditingGoalName(true)} style={{cursor: 'pointer'}} className="project-detail-name">
                              {goal.name}
                            </h2>
                          )}
                        </div>

                        {/* Description Field */}
                        <div style={{marginBottom: '20px'}}>
                          <label className="project-date-label" style={{display: 'block', marginBottom: '8px'}}>
                            Description:
                          </label>
                          <textarea
                            value={goal.description || ''}
                            onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { description: e.target.value })}
                            placeholder="Add a description..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '12px',
                              background: 'rgba(42, 42, 62, 0.8)',
                              border: '2px solid rgba(125, 211, 192, 0.3)',
                              borderRadius: '10px',
                              color: '#f4e8d8',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Outcome Field */}
                        <div style={{marginBottom: '20px'}}>
                          <label className="project-date-label" style={{display: 'block', marginBottom: '8px'}}>
                            Outcome:
                          </label>
                          <textarea
                            value={goal.outcome || ''}
                            onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { outcome: e.target.value })}
                            placeholder="Add the desired outcome..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '12px',
                              background: 'rgba(42, 42, 62, 0.8)',
                              border: '2px solid rgba(125, 211, 192, 0.3)',
                              borderRadius: '10px',
                              color: '#f4e8d8',
                              fontSize: '0.95rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>

                        {/* Goal Dates */}
                        <div className="project-dates-section">
                          <div className="project-date-field">
                            <label className="project-date-label">Start Date:</label>
                            <input
                              type="date"
                              value={goal.startDate || ''}
                              onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { startDate: e.target.value })}
                              className="date-picker"
                            />
                          </div>
                          <div className="project-date-field">
                            <label className="project-date-label">End Date:</label>
                            <input
                              type="date"
                              value={goal.endDate || ''}
                              onChange={(e) => updateGoal(selectedGoal.listName, selectedGoal.id, { endDate: e.target.value })}
                              className="date-picker"
                            />
                          </div>
                        </div>

                        {/* Before Photos */}
                        <div style={{marginBottom: '20px'}}>
                          <div style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#f4e8d8',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '2px solid rgba(125, 211, 192, 0.2)'
                          }}>
                            Before Photos
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addPhotoToGoal(selectedGoal.listName, selectedGoal.id, file, 'beforePhotos');
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {goal.beforePhotos && goal.beforePhotos.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px'
                            }}>
                              {goal.beforePhotos.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(125, 211, 192, 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="Before" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    onClick={() => removePhotoFromGoal(selectedGoal.listName, selectedGoal.id, photo.id, 'beforePhotos')}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* After Photos */}
                        <div style={{marginBottom: '20px'}}>
                          <div style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: '#f4e8d8',
                            marginBottom: '10px',
                            paddingBottom: '8px',
                            borderBottom: '2px solid rgba(125, 211, 192, 0.2)'
                          }}>
                            After Photos
                          </div>

                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '10px'
                          }}>
                            <button
                              className="toolbar-btn"
                              onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.multiple = true;
                                input.onchange = (evt) => {
                                  const files = Array.from(evt.target.files);
                                  files.forEach(file => {
                                    if (file) {
                                      addPhotoToGoal(selectedGoal.listName, selectedGoal.id, file, 'afterPhotos');
                                    }
                                  });
                                };
                                input.click();
                              }}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                                <line x1="17" y1="3" x2="17" y2="6"></line>
                                <circle cx="17" cy="2" r="1"></circle>
                              </svg>
                              Add Photos
                            </button>
                          </div>
                          
                          {goal.afterPhotos && goal.afterPhotos.length > 0 && (
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '10px'
                            }}>
                              {goal.afterPhotos.map(photo => (
                                <div 
                                  key={photo.id} 
                                  style={{
                                    position: 'relative',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    border: '2px solid rgba(125, 211, 192, 0.3)',
                                    aspectRatio: '1',
                                  }}
                                >
                                  <img 
                                    src={photo.data} 
                                    alt="After" 
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                      display: 'block'
                                    }}
                                  />
                                  <button 
                                    onClick={() => removePhotoFromGoal(selectedGoal.listName, selectedGoal.id, photo.id, 'afterPhotos')}
                                    style={{
                                      position: 'absolute',
                                      top: '5px',
                                      right: '5px',
                                      background: 'rgba(0, 0, 0, 0.7)',
                                      color: '#fff',
                                      border: 'none',
                                      borderRadius: '50%',
                                      width: '24px',
                                      height: '24px',
                                      cursor: 'pointer',
                                      fontSize: '16px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: 0,
                                      lineHeight: 1
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Associated Projects */}
                      <div className="goal-projects-section">
                        <h3 style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          marginTop: 0,
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Projects ({goalProjects.length})
                        </h3>
                        
                        {goalProjects.length === 0 ? (
                          <div style={{
                            color: '#b8a99a',
                            fontSize: '0.95rem',
                            padding: '20px',
                            textAlign: 'center',
                            background: 'rgba(42, 42, 62, 0.4)',
                            borderRadius: '10px'
                          }}>
                            No projects associated with this goal yet
                          </div>
                        ) : (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            {goalProjects.map(project => {
                              const projectListName = ['personal', 'work', 'home', 'travel', 'kids'].find(
                                list => projects[list]?.some(p => p.id === project.id)
                              );
                              
                              return (
                                <div 
                                  key={project.id} 
                                  className="project-card"
                                  onClick={() => {
                                    setSelectedGoal(null);
                                    setSelectedProject({ id: project.id, listName: projectListName });
                                    setAppMode('projects');
                                  }}
                                  style={{cursor: 'pointer'}}
                                >
                                  <div className="project-header">
                                    <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                      <span className={`list-badge ${projectListName}`}>{projectListName}</span>
                                      <h3>{project.name}</h3>
                                    </div>
                                  </div>
                                  {project.description && (
                                    <p className="project-description">{project.description}</p>
                                  )}
                                  {(project.startDate || project.endDate) && (
                                    <div className="project-meta">
                                      {project.startDate && (
                                        <span className="project-meta-item">
                                          Start: {new Date(project.startDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      {project.endDate && (
                                        <span className="project-meta-item">
                                          End: {new Date(project.endDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Time Logged */}
                      <div style={{
                        marginTop: '30px',
                        padding: '20px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        borderRadius: '15px',
                        border: '2px solid rgba(125, 211, 192, 0.3)'
                      }}>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Time Logged
                        </div>
                        {(goal.timeLogged || 0) > 0 && (
                          <div style={{
                            fontFamily: 'Quicksand, sans-serif',
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            color: '#f4e8d8',
                            marginBottom: '15px',
                            textAlign: 'center'
                          }}>
                            {(() => {
                              const hours = Math.floor((goal.timeLogged || 0) / 60);
                              const minutes = (goal.timeLogged || 0) % 60;
                              if (hours > 0) {
                                return `${hours}h ${minutes}m`;
                              } else {
                                return `${minutes}m`;
                              }
                            })()}
                          </div>
                        )}
                        <div style={{textAlign: 'center'}}>
                          <button 
                            className="add-task-btn"
                            onClick={() => {
                              setTimeLoggerContext({ type: 'goal', id: selectedGoal.id, listName: selectedGoal.listName });
                              setShowTimeLogger(true);
                              setLoggedMinutes(0);
                              setIsLogging(false);
                              setLogStartTime(null);
                            }}
                            style={{width: 'auto', padding: '12px 30px'}}
                          >
                            Log Time
                          </button>
                        </div>

                        {/* Time Log History */}
                        {(goal.timeLogs || []).length > 0 && (
                          <div style={{marginTop: '30px'}}>
                            <h3 style={{
                              fontFamily: 'Quicksand, sans-serif',
                              fontSize: '1.1rem',
                              fontWeight: '700',
                              color: '#f4e8d8',
                              marginBottom: '15px',
                              marginTop: 0,
                              paddingBottom: '10px',
                              borderBottom: '2px solid rgba(125, 211, 192, 0.2)'
                            }}>
                              History
                            </h3>
                            
                            {(goal.timeLogs || []).slice().reverse().map((log) => (
                              <div 
                                key={log.id}
                                onClick={() => {
                                  setEditingTimeLog(log);
                                  setLoggedMinutes(log.minutes);
                                  setTimeLogFocus(log.focus || '');
                                  setTimeLogDescription(log.description || '');
                                  setTimeLogTakeAway(log.takeAway || '');
                                }}
                                style={{
                                  padding: '15px',
                                  background: 'rgba(52, 52, 72, 0.6)',
                                  borderRadius: '10px',
                                  marginBottom: '10px',
                                  border: '2px solid rgba(125, 211, 192, 0.3)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(52, 52, 72, 0.8)';
                                  e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.5)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(52, 52, 72, 0.6)';
                                  e.currentTarget.style.borderColor = 'rgba(125, 211, 192, 0.3)';
                                }}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: '8px'
                                }}>
                                  <div style={{
                                    fontFamily: 'Quicksand, sans-serif',
                                    fontSize: '1rem',
                                    fontWeight: '600',
                                    color: '#f4e8d8'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                  <div style={{
                                    fontSize: '0.85rem',
                                    color: '#b8a99a'
                                  }}>
                                    {new Date(log.date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: 'numeric',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                                
                                {log.focus && (
                                  <div style={{
                                    fontSize: '0.95rem',
                                    color: '#f4e8d8',
                                    marginBottom: '5px',
                                    fontWeight: '500'
                                  }}>
                                    {log.focus}
                                  </div>
                                )}
                                
                                {log.description && (
                                  <div style={{
                                    fontSize: '0.9rem',
                                    color: '#b8a99a',
                                    lineHeight: '1.4',
                                    marginBottom: '8px'
                                  }}>
                                    {log.description}
                                  </div>
                                )}

                                {log.takeAway && (
                                  <div style={{
                                    fontSize: '0.95rem',
                                    color: '#f4e8d8',
                                    lineHeight: '1.5',
                                    marginTop: '10px',
                                    padding: '12px',
                                    background: 'rgba(125, 211, 192, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(125, 211, 192, 0.3)',
                                    fontWeight: '500'
                                  }}>
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: '#7dd3c0',
                                      marginBottom: '5px',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.5px',
                                      fontWeight: '600'
                                    }}>
                                      Take Away
                                    </div>
                                    {log.takeAway}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Goal Actions */}
                      <div className="project-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => setSelectedGoal(null)}
                        >
                          Close
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => setGoalToDelete({ id: goal.id, listName: selectedGoal.listName, name: goal.name })}
                        >
                          Delete
                        </button>
                      </div>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}

            {/* Goal Form Modal */}
            {showGoalForm && (
              <div className="modal-overlay" onClick={() => setShowGoalForm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>{editingGoal ? 'Edit Goal' : 'New Goal'}</h3>
                  <input
                    type="text"
                    placeholder="Goal name"
                    value={goalFormData.name}
                    onChange={(e) => setGoalFormData(prev => ({ ...prev, name: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(42, 42, 62, 0.8)',
                      border: '2px solid rgba(125, 211, 192, 0.3)',
                      borderRadius: '10px',
                      color: '#f4e8d8',
                      fontSize: '1rem',
                      marginBottom: '15px'
                    }}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    value={goalFormData.description}
                    onChange={(e) => setGoalFormData(prev => ({ ...prev, description: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(42, 42, 62, 0.8)',
                      border: '2px solid rgba(125, 211, 192, 0.3)',
                      borderRadius: '10px',
                      color: '#f4e8d8',
                      fontSize: '1rem',
                      marginBottom: '15px',
                      minHeight: '80px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{display: 'flex', gap: '15px', marginBottom: '20px'}}>
                    <div style={{flex: 1}}>
                      <label style={{display: 'block', color: '#b8a99a', fontSize: '0.9rem', marginBottom: '5px'}}>
                        Start Date (optional)
                      </label>
                      <input
                        type="date"
                        value={goalFormData.startDate}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="date-picker"
                        style={{width: '100%'}}
                      />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{display: 'block', color: '#b8a99a', fontSize: '0.9rem', marginBottom: '5px'}}>
                        End Date (optional)
                      </label>
                      <input
                        type="date"
                        value={goalFormData.endDate}
                        onChange={(e) => setGoalFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="date-picker"
                        style={{width: '100%'}}
                      />
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        if (!goalFormData.name.trim()) return;
                        
                        if (editingGoal) {
                          updateGoal(editingGoal.listName, editingGoal.id, {
                            name: goalFormData.name.trim(),
                            description: goalFormData.description.trim(),
                            startDate: goalFormData.startDate,
                            endDate: goalFormData.endDate
                          });
                        } else {
                          addGoal(
                            currentGoalList,
                            goalFormData.name.trim(),
                            goalFormData.description.trim(),
                            goalFormData.startDate,
                            goalFormData.endDate
                          );
                        }
                        
                        setShowGoalForm(false);
                        setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                        setEditingGoal(null);
                      }}
                    >
                      {editingGoal ? 'Save' : 'Create'}
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setShowGoalForm(false);
                        setGoalFormData({ name: '', description: '', startDate: '', endDate: '' });
                        setEditingGoal(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Goal Delete Confirmation Modal */}
            {goalToDelete && (
              <div className="modal-overlay" onClick={() => setGoalToDelete(null)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <h3>Delete Goal?</h3>
                  <p style={{color: '#b8a99a', marginBottom: '20px', textAlign: 'center'}}>
                    "{goalToDelete.name}"
                  </p>
                  <p style={{color: '#b8a99a', marginBottom: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
                    This will remove the goal from all associated projects.
                  </p>
                  <div className="modal-actions" style={{justifyContent: 'center'}}>
                    <button 
                      className="delete-btn" 
                      onClick={() => {
                        deleteGoal(goalToDelete.listName, goalToDelete.id);
                        setGoalToDelete(null);
                      }}
                    >
                      Delete
                    </button>
                    <button 
                      className="edit-btn" 
                      onClick={() => setGoalToDelete(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

            {/* Time Logger Modal */}
            {showTimeLogger && timeLoggerContext && (
              <div className="modal-overlay" onClick={() => {
                setShowTimeLogger(false);
                setIsLogging(false);
                setLoggedMinutes(0);
                setLogStartTime(null);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
                setTimeLoggerContext(null);
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  textAlign: 'center',
                  padding: '20px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  {/* Fire Logo */}
                  <div 
                    onClick={() => {
                      if (!isLogging) {
                        // Start logging
                        setIsLogging(true);
                        setLogStartTime(Date.now());
                        setLoggedMinutes(0);
                      } else {
                        // Stop logging (but keep modal open)
                        setIsLogging(false);
                        setLogStartTime(null);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      marginTop: '40px',
                      marginBottom: '15px',
                      display: 'inline-block',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '180px',
                      height: '180px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Circular Progress Ring */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-15px',
                          left: '-15px',
                          width: '210px',
                          height: '210px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        {/* Background circle */}
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          stroke="rgba(58, 58, 74, 0.3)"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        {isLogging && (
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="#7dd3c0"
                            strokeWidth="8"
                            strokeDasharray="597"
                            strokeDashoffset="597"
                            strokeLinecap="round"
                            style={{
                              animation: `progressRing ${timerDuration || 60}s linear infinite`
                            }}
                          />
                        )}
                      </svg>
                      
                      {/* Fire Icon */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        filter: isLogging ? 'drop-shadow(0 0 25px rgba(255, 69, 0, 0.8))' : 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))',
                        animation: isLogging ? 'flameGlow 10s ease-in-out infinite' : 'none'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{width: '100%', height: '100%'}}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill={isLogging ? '#FF4500' : '#3a3a4a'} stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          -1 -56z"/>
                          <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                          -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                          -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                          -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                          289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                          553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                          -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                          <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                          -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                          -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                          -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                          36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                          -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                          95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                        </g>
                      </svg>
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  {loggedMinutes >= 1 && (
                    <div style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '2rem',
                      fontWeight: '600',
                      color: isLogging ? '#7dd3c0' : '#64748b',
                      marginBottom: '15px',
                      letterSpacing: '0.05em'
                    }}>
                      {loggedMinutes} min
                    </div>
                  )}

                  {/* Timer Duration Selector */}
                  <div style={{textAlign: 'left', marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Duration:
                    </label>
                    <select
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '1rem',
                        fontFamily: 'Quicksand, sans-serif',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">Timer</option>
                      <option value={300}>5 Minutes</option>
                      <option value={420}>7 Minutes</option>
                      <option value={600}>10 Minutes</option>
                      <option value={1800}>30 Minutes</option>
                      <option value={3600}>60 Minutes</option>
                    </select>
                  </div>

                  {/* Focus and Description Fields */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What are you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        marginBottom: '15px'
                      }}
                    />
                    
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Optional notes..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Take Away Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <p style={{
                    color: '#b8a99a',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    {isLogging ? 'Click fire to stop timer' : 'Click fire to start logging'}
                  </p>

                  {/* Action Buttons */}
                  <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                    <button 
                      className="edit-btn"
                      onClick={() => {
                        if (loggedMinutes > 0 && timeLoggerContext) {
                          const newTimeLog = {
                            id: Date.now(),
                            minutes: loggedMinutes,
                            focus: timeLogFocus,
                            description: timeLogDescription,
                            takeAway: timeLogTakeAway,
                            date: new Date().toISOString()
                          };
                          
                          if (timeLoggerContext.type === 'note') {
                            // Update note
                            const note = notes.find(n => n.id === timeLoggerContext.id);
                            if (note) {
                              setNotes(prev => prev.map(n => 
                                n.id === timeLoggerContext.id 
                                  ? {
                                      ...n,
                                      timeLogged: (n.timeLogged || 0) + loggedMinutes,
                                      timeLogs: [...(n.timeLogs || []), newTimeLog]
                                    }
                                  : n
                              ));
                            }
                          } else if (timeLoggerContext.type === 'goal') {
                            // Update goal
                            const goal = goals[timeLoggerContext.listName]?.find(g => g.id === timeLoggerContext.id);
                            if (goal) {
                              updateGoal(timeLoggerContext.listName, timeLoggerContext.id, {
                                timeLogged: (goal.timeLogged || 0) + loggedMinutes,
                                timeLogs: [...(goal.timeLogs || []), newTimeLog]
                              });
                            }
                          }
                        }
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                        setLogStartTime(null);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimeLoggerContext(null);
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Save
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                        setLogStartTime(null);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimeLoggerContext(null);
                      }}
                      style={{width: 'auto', padding: '10px 30px'}}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Time Log Modal */}
            {editingTimeLog && selectedGoal && (
              <div className="modal-overlay" onClick={() => {
                setEditingTimeLog(null);
                setLoggedMinutes(0);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  padding: '20px'
                }}>
                  <h3 style={{marginTop: 0, marginBottom: '15px'}}>Edit Time Log</h3>
                  
                  {/* Minutes Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Minutes:
                    </label>
                    <input
                      type="number"
                      value={loggedMinutes}
                      onChange={(e) => setLoggedMinutes(parseInt(e.target.value) || 0)}
                      min="0"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '1.2rem',
                        fontWeight: '600'
                      }}
                    />
                  </div>

                  {/* Focus Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What were you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  {/* Description Input */}
                  <div style={{marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Any notes about this session?"
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Take Away Input */}
                  <div style={{marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '8px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="modal-actions" style={{justifyContent: 'space-between'}}>
                    <button 
                      className="delete-btn"
                      onClick={() => {
                        const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                        if (goal) {
                          const updatedLogs = (goal.timeLogs || []).filter(log => log.id !== editingTimeLog.id);
                          const minutesDiff = editingTimeLog.minutes;
                          
                          updateGoal(selectedGoal.listName, selectedGoal.id, {
                            timeLogs: updatedLogs,
                            timeLogged: Math.max(0, (goal.timeLogged || 0) - minutesDiff)
                          });
                        }
                        setEditingTimeLog(null);
                        setLoggedMinutes(0);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                      }}
                      style={{marginRight: 'auto'}}
                    >
                      Delete
                    </button>
                    
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button 
                        className="edit-btn"
                        onClick={() => {
                          const goal = goals[selectedGoal.listName]?.find(g => g.id === selectedGoal.id);
                          if (goal) {
                            const updatedLogs = (goal.timeLogs || []).map(log => 
                              log.id === editingTimeLog.id 
                                ? { 
                                    ...log, 
                                    minutes: loggedMinutes,
                                    focus: timeLogFocus,
                                    description: timeLogDescription,
                                    takeAway: timeLogTakeAway
                                  }
                                : log
                            );
                            
                            const minutesDiff = loggedMinutes - editingTimeLog.minutes;
                            
                            updateGoal(selectedGoal.listName, selectedGoal.id, {
                              timeLogs: updatedLogs,
                              timeLogged: (goal.timeLogged || 0) + minutesDiff
                            });
                          }
                          setEditingTimeLog(null);
                          setLoggedMinutes(0);
                          setTimeLogFocus('');
                          setTimeLogDescription('');
                          setTimeLogTakeAway('');
                        }}
                      >
                        Save
                      </button>
                      
                      <button 
                        className="delete-btn"
                        onClick={() => {
                          setEditingTimeLog(null);
                          setLoggedMinutes(0);
                          setTimeLogFocus('');
                          setTimeLogDescription('');
                          setTimeLogTakeAway('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


        {appMode === 'time' && (
          <div className="time-section">
            {/* Log Time Button */}
            <div style={{display: 'block', textAlign: 'center', marginBottom: '30px'}}>
              <button 
                className="add-task-btn" 
                onClick={() => setShowTimeLogger(true)}
                style={{width: '70%', display: 'inline-block'}}
              >
                Log Time
              </button>
            </div>

            {/* Time Log Records */}
            <div style={{
              padding: '20px 40px',
              minHeight: '400px'
            }}>
              {(() => {
                const allTimeLogs = getAllTimeLogs();
                
                if (allTimeLogs.length === 0) {
                  return (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  );
                }

                // Group time logs by source
                const groupedLogs = {
                  goal: allTimeLogs.filter(log => log.source === 'goal'),
                  journal: allTimeLogs.filter(log => log.source === 'journal'),
                  time: allTimeLogs.filter(log => log.source === 'time')
                };

                return (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '30px'}}>
                    {/* Goal Time Logs */}
                    {groupedLogs.goal.length > 0 && (
                      <div>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Goal Time Logs
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {groupedLogs.goal.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `goal-${log.id}-${index}`;
                            return (
                              <div key={`goal-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(52, 52, 72, 0.6)',
                                borderRadius: '10px',
                                border: '2px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `goal-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'Quicksand, sans-serif'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{
                                      color: '#f4e8d8',
                                      fontSize: '0.9rem',
                                      fontFamily: 'Quicksand, sans-serif',
                                      marginTop: '3px'
                                    }}>
                                      {log.sourceName}
                                    </div>
                                  </div>
                                  <div style={{
                                    color: '#7dd3c0',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Quicksand, sans-serif'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(125, 211, 192, 0.2)'}}>
                                    {log.focus && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Focus:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.focus}
                                        </div>
                                      </div>
                                    )}
                                    {log.description && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Description:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.description}
                                        </div>
                                      </div>
                                    )}
                                    {log.takeAway && (
                                      <div style={{marginBottom: '15px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Take Away:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          fontStyle: 'italic'
                                        }}>
                                          {log.takeAway}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Add Time Button */}
                                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                      <button
                                        className="add-task-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTimeLoggerContext({
                                            type: 'goal',
                                            id: log.sourceId,
                                            listName: log.listName
                                          });
                                          setShowTimeLogger(true);
                                        }}
                                        style={{width: 'auto', padding: '12px 30px'}}
                                      >
                                        Add Time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Journal Time Logs */}
                    {groupedLogs.journal.length > 0 && (
                      <div>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Journal Time Logs
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {groupedLogs.journal.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `journal-${log.id}-${index}`;
                            return (
                              <div key={`journal-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(52, 52, 72, 0.6)',
                                borderRadius: '10px',
                                border: '2px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `journal-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'Quicksand, sans-serif'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    <div style={{
                                      color: '#f4e8d8',
                                      fontSize: '0.9rem',
                                      fontFamily: 'Quicksand, sans-serif',
                                      marginTop: '3px'
                                    }}>
                                      {log.sourceName}
                                    </div>
                                  </div>
                                  <div style={{
                                    color: '#7dd3c0',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Quicksand, sans-serif'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(125, 211, 192, 0.2)'}}>
                                    {log.focus && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Focus:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.focus}
                                        </div>
                                      </div>
                                    )}
                                    {log.description && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Description:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.description}
                                        </div>
                                      </div>
                                    )}
                                    {log.takeAway && (
                                      <div style={{marginBottom: '15px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Take Away:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          fontStyle: 'italic'
                                        }}>
                                          {log.takeAway}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Add Time Button */}
                                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                      <button
                                        className="add-task-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setTimeLoggerContext({
                                            type: 'note',
                                            id: log.sourceId
                                          });
                                          setShowTimeLogger(true);
                                        }}
                                        style={{width: 'auto', padding: '12px 30px'}}
                                      >
                                        Add Time
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Standalone Time Logs */}
                    {groupedLogs.time.length > 0 && (
                      <div>
                        <div style={{
                          fontFamily: 'Quicksand, sans-serif',
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: '#f4e8d8',
                          marginBottom: '15px',
                          paddingBottom: '10px',
                          borderBottom: '4px solid rgba(125, 211, 192, 0.3)'
                        }}>
                          Time Logs
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          {groupedLogs.time.map((log, index) => {
                            const isExpanded = expandedTimeLogId === `time-${log.id}-${index}`;
                            return (
                              <div key={`time-${log.id}-${index}`} style={{
                                padding: '15px',
                                background: 'rgba(52, 52, 72, 0.6)',
                                borderRadius: '10px',
                                border: '2px solid rgba(100, 116, 139, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onClick={() => setExpandedTimeLogId(isExpanded ? null : `time-${log.id}-${index}`)}
                              >
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <div style={{flex: 1}}>
                                    <div style={{
                                      color: '#999',
                                      fontSize: '0.85rem',
                                      fontFamily: 'Quicksand, sans-serif'
                                    }}>
                                      {new Date(log.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: 'numeric',
                                        minute: '2-digit'
                                      })}
                                    </div>
                                    {log.focus && (
                                      <div style={{
                                        color: '#f4e8d8',
                                        fontSize: '0.9rem',
                                        fontFamily: 'Quicksand, sans-serif',
                                        marginTop: '3px'
                                      }}>
                                        {log.focus}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{
                                    color: '#7dd3c0',
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    fontFamily: 'Quicksand, sans-serif'
                                  }}>
                                    {log.minutes} min
                                  </div>
                                </div>
                                
                                {isExpanded && (
                                  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(125, 211, 192, 0.2)'}}>
                                    {log.focus && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Focus:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.focus}
                                        </div>
                                      </div>
                                    )}
                                    {log.description && (
                                      <div style={{marginBottom: '10px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Description:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif'
                                        }}>
                                          {log.description}
                                        </div>
                                      </div>
                                    )}
                                    {log.takeAway && (
                                      <div style={{marginBottom: '15px'}}>
                                        <div style={{
                                          color: '#b8a99a',
                                          fontSize: '0.8rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          marginBottom: '3px'
                                        }}>
                                          Take Away:
                                        </div>
                                        <div style={{
                                          color: '#d0c8c0',
                                          fontSize: '0.9rem',
                                          fontFamily: 'Quicksand, sans-serif',
                                          fontStyle: 'italic'
                                        }}>
                                          {log.takeAway}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Delete Button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setStandaloneTimeLogs(prev => prev.filter(l => l.id !== log.id));
                                      }}
                                      style={{
                                        padding: '6px 12px',
                                        background: 'rgba(255, 75, 75, 0.2)',
                                        border: '1px solid rgba(255, 75, 75, 0.4)',
                                        borderRadius: '6px',
                                        color: '#ff6b6b',
                                        fontSize: '0.85rem',
                                        fontFamily: 'Quicksand, sans-serif',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Total Time Summary */}
                    <div style={{
                      padding: '20px',
                      background: 'rgba(42, 42, 62, 0.8)',
                      borderRadius: '10px',
                      border: '2px solid rgba(125, 211, 192, 0.3)',
                      textAlign: 'center'
                    }}>
                      <span style={{
                        color: '#7dd3c0',
                        fontSize: '1.3rem',
                        fontWeight: '700',
                        fontFamily: 'Quicksand, sans-serif'
                      }}>
                        Total Time Logged: {allTimeLogs.reduce((sum, log) => sum + log.minutes, 0)} minutes
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Time Logger Modal */}
            {showTimeLogger && (
              <div className="modal-overlay" onClick={() => {
                setShowTimeLogger(false);
                setIsLogging(false);
                setLoggedMinutes(0);
                setLogStartTime(null);
                setTimeLogFocus('');
                setTimeLogDescription('');
                setTimeLogTakeAway('');
                setTimerDuration('');
              }}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                  width: '90%',
                  maxWidth: '500px',
                  textAlign: 'center',
                  padding: '20px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}>
                  {/* Fire Logo with Timer */}
                  <div 
                    onClick={() => {
                      if (!isLogging) {
                        setIsLogging(true);
                        setLogStartTime(Date.now());
                        setLoggedMinutes(0);
                      } else {
                        setIsLogging(false);
                        setLogStartTime(null);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      marginTop: '40px',
                      marginBottom: '15px',
                      display: 'inline-block',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    <div style={{
                      width: '180px',
                      height: '180px',
                      position: 'relative',
                      display: 'inline-block'
                    }}>
                      {/* Circular Progress Ring */}
                      <svg 
                        style={{
                          position: 'absolute',
                          top: '-15px',
                          left: '-15px',
                          width: '210px',
                          height: '210px',
                          transform: 'rotate(-90deg)',
                          pointerEvents: 'none'
                        }}
                      >
                        <circle
                          cx="105"
                          cy="105"
                          r="95"
                          fill="none"
                          stroke="rgba(58, 58, 74, 0.3)"
                          strokeWidth="8"
                        />
                        {isLogging && (
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="#7dd3c0"
                            strokeWidth="8"
                            strokeDasharray="597"
                            strokeDashoffset="597"
                            strokeLinecap="round"
                            style={{
                              animation: `progressRing ${timerDuration || 60}s linear infinite`
                            }}
                          />
                        )}
                      </svg>
                      
                      {/* Fire Icon */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        filter: isLogging ? 'drop-shadow(0 0 25px rgba(255, 69, 0, 0.8))' : 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))',
                        animation: isLogging ? 'flameGlow 10s ease-in-out infinite' : 'none'
                      }}>
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{width: '100%', height: '100%'}}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill={isLogging ? '#FF4500' : '#3a3a4a'} stroke="none">
                          <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                          -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                          -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                          17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                          -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                          132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                          680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                          -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                          -1 -56z"/>
                          <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                          -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                          -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                          -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                          289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                          553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                          -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                          <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                          -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                          -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                          -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                          36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                          -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                          95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                        </g>
                      </svg>
                      </div>
                    </div>
                  </div>

                  {/* Timer Display */}
                  {loggedMinutes >= 1 && (
                    <div style={{
                      fontFamily: 'Quicksand, sans-serif',
                      fontSize: '2rem',
                      fontWeight: '600',
                      color: isLogging ? '#7dd3c0' : '#64748b',
                      marginBottom: '15px',
                      letterSpacing: '0.05em'
                    }}>
                      {loggedMinutes} min
                    </div>
                  )}

                  {/* Timer Duration Selector */}
                  <div style={{textAlign: 'left', marginBottom: '20px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Duration:
                    </label>
                    <select
                      value={timerDuration}
                      onChange={(e) => setTimerDuration(e.target.value === '' ? '' : Number(e.target.value))}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '1rem',
                        fontFamily: 'Quicksand, sans-serif',
                        cursor: 'pointer',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Timer</option>
                      <option value={300}>5 Minutes</option>
                      <option value={420}>7 Minutes</option>
                      <option value={600}>10 Minutes</option>
                      <option value={1800}>30 Minutes</option>
                      <option value={3600}>60 Minutes</option>
                    </select>
                  </div>

                  {/* Focus Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Focus:
                    </label>
                    <input
                      type="text"
                      value={timeLogFocus}
                      onChange={(e) => setTimeLogFocus(e.target.value)}
                      placeholder="What are you focusing on?"
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  
                  {/* Description Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Description:
                    </label>
                    <textarea
                      value={timeLogDescription}
                      onChange={(e) => setTimeLogDescription(e.target.value)}
                      placeholder="Optional notes..."
                      style={{
                        width: '100%',
                        minHeight: '60px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Take Away Field */}
                  <div style={{textAlign: 'left', marginBottom: '15px'}}>
                    <label style={{
                      display: 'block',
                      color: '#b8a99a',
                      fontSize: '0.9rem',
                      marginBottom: '5px',
                      fontFamily: 'Quicksand, sans-serif'
                    }}>
                      Take Away:
                    </label>
                    <textarea
                      value={timeLogTakeAway}
                      onChange={(e) => setTimeLogTakeAway(e.target.value)}
                      placeholder="What did you learn or accomplish?"
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '10px',
                        background: 'rgba(42, 42, 62, 0.8)',
                        border: '2px solid rgba(125, 211, 192, 0.3)',
                        borderRadius: '8px',
                        color: '#f4e8d8',
                        fontSize: '0.95rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <p style={{
                    color: '#b8a99a',
                    fontSize: '0.9rem',
                    marginBottom: '20px'
                  }}>
                    {isLogging ? 'Click fire to stop timer' : 'Click fire to start logging'}
                  </p>

                  {/* Save Button */}
                  <button 
                    className="edit-btn"
                    onClick={() => {
                      if (loggedMinutes > 0) {
                        const newTimeLog = {
                          id: Date.now(),
                          minutes: loggedMinutes,
                          focus: timeLogFocus,
                          description: timeLogDescription,
                          takeAway: timeLogTakeAway,
                          date: new Date().toISOString()
                        };
                        
                        setStandaloneTimeLogs(prev => [newTimeLog, ...prev]);
                        
                        // Close modal and reset
                        setShowTimeLogger(false);
                        setIsLogging(false);
                        setLoggedMinutes(0);
                        setLogStartTime(null);
                        setTimeLogFocus('');
                        setTimeLogDescription('');
                        setTimeLogTakeAway('');
                        setTimerDuration('');
                      }
                    }}
                    disabled={loggedMinutes === 0}
                    style={{
                      opacity: loggedMinutes === 0 ? 0.5 : 1,
                      cursor: loggedMinutes === 0 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Save Time Log
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {appMode === 'archive' && (
          <div className="archive-section">
            <h2>Archive</h2>
            
            <div className="tabs">
              <button 
                className={`tab ${currentList === 'master' ? 'active' : ''}`}
                onClick={() => setCurrentList('master')}
              >
                All
              </button>
              <button 
                className={`tab ${currentList === 'personal' ? 'active' : ''}`}
                onClick={() => setCurrentList('personal')}
              >
                Personal
              </button>
              <button 
                className={`tab ${currentList === 'work' ? 'active' : ''}`}
                onClick={() => setCurrentList('work')}
              >
                Work
              </button>
              <button 
                className={`tab ${currentList === 'home' ? 'active' : ''}`}
                onClick={() => setCurrentList('home')}
              >
                Home
              </button>
              <button 
                className={`tab ${currentList === 'travel' ? 'active' : ''}`}
                onClick={() => setCurrentList('travel')}
              >
                Travel
              </button>
              <button 
                className={`tab ${currentList === 'kids' ? 'active' : ''}`}
                onClick={() => setCurrentList('kids')}
              >
                Kids
              </button>
            </div>

            <div className="archived-tasks-container">
              {(() => {
                const tasksToShow = currentList === 'master' 
                  ? Object.entries(archivedTasks).flatMap(([listName, tasks]) => 
                      tasks.map(task => ({ ...task, listName }))
                    )
                  : archivedTasks[currentList] || [];

                if (tasksToShow.length === 0) {
                  return (
                    <div className="empty-state" style={{display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px'}}>
                      <div style={{
                        width: '180px',
                        height: '180px',
                        position: 'relative',
                        display: 'inline-block'
                      }}>
                        {/* Background circle */}
                        <svg 
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            left: '-15px',
                            width: '210px',
                            height: '210px',
                            transform: 'rotate(-90deg)',
                            pointerEvents: 'none'
                          }}
                        >
                          <circle
                            cx="105"
                            cy="105"
                            r="95"
                            fill="none"
                            stroke="rgba(58, 58, 74, 0.3)"
                            strokeWidth="8"
                          />
                        </svg>
                        
                        {/* Dark Fire Icon */}
                        <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 1280.000000 1280.000000"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            width: '100%',
                            height: '100%',
                            filter: 'drop-shadow(0 0 10px rgba(100, 100, 100, 0.3))'
                          }}>
                          <g transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
                            fill="#3a3a4a" stroke="none">
                            <path d="M7090 12669 c-1 -257 -76 -628 -175 -871 -149 -365 -354 -643 -825
                            -1123 -562 -572 -1053 -1165 -1415 -1710 -256 -385 -443 -729 -568 -1045 -164
                            -415 -213 -716 -189 -1167 7 -126 17 -257 22 -293 4 -36 11 -87 15 -115 3 -27
                            17 -108 31 -180 66 -339 167 -634 321 -937 181 -358 383 -630 707 -954 206
                            -206 336 -319 558 -486 130 -98 458 -322 462 -316 1 1 20 53 40 113 45 131
                            132 315 211 452 58 99 233 361 296 443 231 303 515 606 864 926 411 375 725
                            680 839 814 99 117 243 309 323 432 261 403 385 922 386 1623 0 207 -4 314
                            -17 410 -76 586 -230 1136 -500 1782 -358 860 -885 1741 -1298 2168 l-87 90
                            -1 -56z"/>
                            <path d="M9510 9493 c0 -5 9 -55 21 -113 89 -462 132 -1021 110 -1453 -13
                            -249 -39 -482 -67 -597 -109 -438 -605 -1140 -1299 -1835 -126 -127 -291 -284
                            -365 -350 -160 -142 -223 -206 -374 -380 -276 -318 -452 -600 -476 -761 -5
                            -38 -19 -133 -31 -211 -21 -141 -21 -189 2 -261 8 -25 15 -32 28 -26 73 31
                            289 101 416 134 203 54 418 97 820 164 894 149 1116 222 1550 511 387 257 676
                            553 814 833 98 197 195 572 233 892 19 165 16 597 -5 780 -104 913 -509 1833
                            -1058 2404 -105 109 -294 276 -312 276 -4 0 -7 -3 -7 -7z"/>
                            <path d="M3355 8046 c-199 -134 -336 -247 -523 -430 -189 -186 -290 -306 -418
                            -498 -270 -403 -415 -856 -401 -1261 8 -258 75 -514 202 -772 237 -481 641
                            -873 1170 -1135 358 -177 715 -283 1170 -349 153 -22 511 -54 546 -49 16 2
                            -12 23 -107 82 -709 437 -1164 850 -1434 1303 -118 197 -228 493 -244 653 -4
                            36 -11 92 -16 125 -5 33 -16 116 -25 185 -8 69 -20 163 -26 210 -6 47 -13 196
                            -16 332 -5 240 4 411 38 673 5 44 12 98 15 120 3 22 9 65 14 95 5 30 12 73 16
                            95 26 174 135 576 188 698 5 9 4 17 0 17 -5 0 -72 -43 -149 -94z"/>
                          </g>
                        </svg>
                      </div>
                    </div>
                  );
                }

                if (currentList === 'master') {
                  const grouped = {};
                  tasksToShow.forEach(task => {
                    if (!grouped[task.listName]) grouped[task.listName] = [];
                    grouped[task.listName].push(task);
                  });

                  return Object.entries(grouped).map(([listName, tasks]) => (
                    <div key={listName} className="archive-list-section">
                      <div className="section-header archive-section-header" style={{textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span>{listName}</span>
                        <span className={`badge ${listName}`}>{tasks.length}</span>
                      </div>
                      {tasks.map((task, idx) => {
                        const actualIndex = archivedTasks[listName].findIndex(t => t === task);
                        return (
                          <div key={idx} className="archived-task">
                            <div className="task-text">{task.text}</div>
                            <div className="task-meta">
                              {task.archivedAt && (
                                <span className="archived-date">
                                  Archived {new Date(task.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                            <div className="archived-task-actions">
                              <button
                                className="edit-btn"
                                onClick={() => unarchiveTask(listName, actualIndex)}
                              >
                                Unarchive
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => deleteArchivedTask(listName, actualIndex)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ));
                } else {
                  return tasksToShow.map((task, idx) => (
                    <div key={idx} className="archived-task">
                      <div className="task-text">{task.text}</div>
                      <div className="task-meta">
                        {task.archivedAt && (
                          <span className="archived-date">
                            Archived {new Date(task.archivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                      <div className="archived-task-actions">
                        <button
                          className="edit-btn"
                          onClick={() => unarchiveTask(currentList, idx)}
                        >
                          Unarchive
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => deleteArchivedTask(currentList, idx)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ));
                }
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
