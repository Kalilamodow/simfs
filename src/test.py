from main import SimulatedFilesystem

simfs = SimulatedFilesystem()

print('creating /foo/')
foo = simfs.root.create_dir('/foo/')
print('foo files:', foo.files())
print('creating /foo/bar.txt')
bar = foo.create_file('bar.txt')
print('foo files:', foo.files())

print('getting /foo/bar.txt')
simfs.get('/foo/bar.txt')
