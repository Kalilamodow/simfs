from __future__ import annotations
from exceptions import InvalidFilenameError


INVALID_FILE_CHARS = ['/', '\\', '|', '?', ':', '*', '<', '>', '"']

def str_path(src: str|Path) -> Path:
    '''Converts an str to a Path if the type is an str'''
    if isinstance(src, str):
        return Path(src)
    else:
        return src


class Path:
    '''A path to some File or Directory. Contains logic for folder navigation. The logic is
    rudimentary and does not apply any checks, but whenever it's used some checks should be implemented.

    `cType` (string): Can be either "directory" or "file", depending on what it represents.
    `sroot` (bool): Whether it's a root path or not. (Starts with a fslash)
    
    `__list`: private member, represents the Path as a list of strings
    `__str`: private member, represents the Path as a string'''
    # private
    __list: list[str]
    __str: str
    # public with @property
    _cType: str
    _sroot: bool


    def __init__(self, path: str | list = '/') -> None:
        if isinstance(path, str):
            l = path.split('/')
            if l == ['', '']:
                l = ['/']
        else:
            l = path

        l = self.remove_empty_from_list(l)
        self.__list = l

        asStr = '/'.join(l).replace('//', '/').replace('//', '/')
        self.__str = asStr

        if asStr.endswith('/'):
            self._cType = 'directory'
        else:
            self._cType = 'file'
        if asStr.startswith('/'):
            self._sroot = True
        else:
            self._sroot = False

    def remove_empty_from_list(self, l: list[str]) -> list[str]:
        '''This does just do what it says it also implements some simple sanitization'''
        res = []
        for idx, part in enumerate(l):
            if idx == 0 and part == '':
                res.append('/')
                continue

            if not part == '':
                res.append(part)
                continue

        if l[-1] == '':
            res[-1] += '/'
        return res

    def go(self, to: Path):
        '''Navigation function.
        
        `to`: Where to navigate'''
        cmdlist = list(to)
        cpath = self.__list.copy()

        for cmd in cmdlist:
            if cmd == '.':
                continue
            if cmd == '..':
                cpath = cpath[:-1]
                continue
            cpath.append(cmd)

        return Path(cpath)
    
    def prepend(self, prepath: Path, modify_self: bool = True):
        '''Prepends another Path to this Path and returns the new Path'''
        if not prepath.cType == 'directory':
            raise ValueError('Prepath should be a directory')
        
        new = Path(str(prepath) + self.__str)
        if modify_self:
            self.__str = str(new)
            self.__list = list(new)

        return new


    def __list__(self): return self.__list

    def __getitem__(self, n): return self.__list[n]

    def __iter__(self): return iter(self.__list)

    def __str__(self): return self.__str

    @property
    def cType(self): return self._cType
    @property
    def sroot(self): return self._sroot


class File:
    '''Contains metadata (`name` and `path`) and the content. (`content`)'''
    name: str
    contents: bytes
    exists: bool

    def __init__(self, path: Path, contents: bytes|None=None):
        name = path[-1]
        if any(x in name for x in INVALID_FILE_CHARS):
            raise InvalidFilenameError
        
        self.name = name
        self.contents = contents if contents is not None else ''.encode()
        self.exists = True


    def write(self, contents: bytes, append=False) -> None:
        '''Write `contents` to this file. If `append`, it will append the contents instead of
        rewriting the whole thing'''
        self.raiseErrorIfNotExists()

        if not append:
            self.contents = contents
            return
        self.contents += contents

    def read(self) -> bytes:
        self.raiseErrorIfNotExists()
        return self.contents
    
    def readAsString(self) -> str:
        self.raiseErrorIfNotExists()
        return self.contents.decode()

    def raiseErrorIfNotExists(self):
        if not self.exists: raise FileNotFoundError(self.name)
    
    def delete(self):
        '''Deletes the File'''
        self.contents = None
        self.exists = False
    
    def __str__(self) -> str:
        return self.name


class Directory:
    '''Consists of a `name`, used to identify it in its parent Directory, a `path` to the Directory,
    and the `children`, which is a list of Files or more Directories that this Directory parents.'''
    name: str
    path: Path
    children: list[File|Directory]

    def __init__(self, path: Path|str):
        path = str_path(path)

        self.path = path
        self.name = path[-1]
        self.children = []

    
    def files(self) -> list[str]:
        '''Lists files (`self.children`) in the directory as a list of strings.'''
        return [x.name for x in self.children]
    
    def create_file(self, fname: str, contents: bytes|None=None) -> File:
        '''Creates a file'''
        # make sure doesn't exist already
        if fname in [n.name for n in self.children]:
            raise FileExistsError
        
        # ok then create
        fi = File(Path(str(self.path) + fname), contents)

        self.children.append(fi)
        return fi
    
    def create_dir(self, path: Path|str):
        '''Creates a directory'''
        path = str_path(path)
        
        name = path[-1]

        if name in [n.name for n in self.children]:
            raise FileExistsError
        
        if not path.sroot:
            path.prepend(self.path)

        ndir = Directory(path)
        self.children.append(ndir)
        return ndir
    
    def create(self, path: Path|str, contents: bytes|None = None, strict=True):
        '''Creates a File|Directory by inferring the type from the path\n
        `strict`: Whether to raise an error if you pass in contents while the path is a directory.
        If false method also raises an error if the path is invalid'''
        path = str_path(path)

        if path.cType == 'directory' and contents is not None and strict:
            raise ValueError("Don't pass in contents if the path type is directory")
        
        if path.cType == 'directory':
            self.create_dir(path)
            return
        elif path.cType == 'file':
            self.create_file(path[-1], contents)
            return


    def exists(self, name: str) -> bool:
        '''Does `name` File or Directory exist?'''
        return name in [n.name for n in self.children]

    def get(self, name: str, quiet=False) -> File|Directory|None:
        '''Gets a File or Directory by name. If none found and `quiet` is false, raises FileNotFound.
        If none found and `quiet` is true, returns `None`.'''
        for p in self.children:
            if p.name == name:
                return p
        if quiet:
            return
        else:
            raise FileNotFoundError

    def delete(self, name: str) -> None:
        '''Deletes a File or Directory by name.'''
        if not self.exists(name):
            raise FileNotFoundError
        
        for i, t in enumerate(self.children):
            if t.name == name:
                # delete File from inside
                ref = self.get(t.name)
                ref.delete()
                # delete from children list
                del self.children[i]
                break
