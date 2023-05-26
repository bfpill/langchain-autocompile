import CompilerService from "../services/CompilerService"


const init = async (req, res) => {
  const { key, language } = req.body;
  try {
    const compiler = CompilerService.init(key, language);
    res.status(200).json({ message: 'Compiler initialized successfully', compiler });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to initialize compiler', error: error.message });
  }
};

const compile = async (req, res) => {
  const { key, code } = req.body;

  try {
    const output = await CompilerService.compile(key, code);
    res.status(200).json({ message: 'Compilation comp aleted', output });
  } catch (error: any) {
    res.status(500).json({ message: 'Compilation failed', error: error.message });
  }
};

export default {
  init,
  compile,
};
